// Preview rows: click to highlight
document.querySelectorAll('.l-row').forEach((r)=>r.addEventListener('click',()=>{
  document.querySelectorAll('.l-row').forEach((x)=>x.classList.remove('sel'));
  r.classList.add('sel');
}));
