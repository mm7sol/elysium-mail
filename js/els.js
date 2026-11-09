// ELS — resolves .els names on Elysium mainnet through the ELS registry.
// Read-only: no wallet, no signature, no transaction.
const ELS = (() => {
  const RPC = 'https://rpc.elysium.kinetiq.xyz';
  const CHAIN_ID = 99901;
  const REGISTRY = '0x5752aCFe755F20dc38F481829587A59a0bF5107c';
  const ZERO = '0x0000000000000000000000000000000000000000';
  const REVERSE_REGISTRAR = '0x1Bb4791eF4C29A4EdDCf958c273cE96F300aaE16';
  const NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.els$/i;
  const RESOLVER_ABI = [
    'function resolver(bytes32 node) view returns (address)',
    'function addr(bytes32 node) view returns (address)'
  ];
  const cache = new Map();
  let provider = null;
  let registry = null;

  function ready() {
    if (!window.ethers) return false;
    if (!provider) {
      provider = new window.ethers.JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
      registry = new window.ethers.Contract(REGISTRY, RESOLVER_ABI, provider);
    }
    return true;
  }

  const isEls = (value) => typeof value === 'string' && NAME_RE.test(value.trim());

  async function resolve(value) {
    const name = (value || '').trim().toLowerCase();
    if (!NAME_RE.test(name) || !ready()) return null;
    if (cache.has(name)) return cache.get(name);
    try {
      const node = window.ethers.namehash(name);
      const resolverAddress = await registry.resolver(node);
      if (!resolverAddress || resolverAddress === ZERO) {
        cache.set(name, null);
        return null;
      }
      const resolver = new window.ethers.Contract(resolverAddress, RESOLVER_ABI, provider);
      const address = await resolver.addr(node);
      const result = (!address || address === ZERO) ? null : address;
      cache.set(name, result);
      return result;
    } catch (error) {
      return null;
    }
  }

  async function reverse(address) {
    if (!window.ethers || !window.ethers.isAddress(address) || !ready()) return null;
    try {
      const node = window.ethers.namehash(address.slice(2).toLowerCase() + '.addr.reverse');
      const resolverAddress = await registry.resolver(node);
      if (!resolverAddress || resolverAddress === ZERO) return null;
      const resolver = new window.ethers.Contract(resolverAddress, ['function name(bytes32 node) view returns (string)'], provider);
      const name = await resolver.name(node);
      return (name && name.length) ? name : null;
    } catch (e) {
      return null;
    }
  }

  const short = (address) => address.slice(0, 6) + '…' + address.slice(-4);

  return { resolve, reverse, isEls, short, RPC, REGISTRY, CHAIN_ID };
})();
