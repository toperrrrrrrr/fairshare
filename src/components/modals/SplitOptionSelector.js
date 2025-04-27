import React from 'react';

const SplitOptionSelector = ({ splitOptions, splitDropdownOpen, setSplitDropdownOpen, form, handleSplitOption }) => (
  <div style={{flex:'1 1 180px',minWidth:0}}>
    <label className="gdash-expense-label" style={{marginBottom:4}}>
      How do you want to split?
      <div style={{position:'relative'}}>
        <button
          type="button"
          className="gdash-split-dropdown-btn"
          style={{width:'100%',padding:'0.55rem 0.9rem',borderRadius:'0.5rem',background:'#f7f7fa',border:'1.5px solid #ececff',fontSize:'1.07rem',fontWeight:500,textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.5rem'}}
          onClick={()=>setSplitDropdownOpen(v=>!v)}
          aria-haspopup="listbox"
          aria-expanded={splitDropdownOpen}
        >
          {splitOptions.find(opt=>opt.value===form.splitOption)?.label || 'Choose split option'}
          <span style={{marginLeft:'auto',fontSize:'1.18em',color:'#8f94fb',transition:'transform 0.18s',transform:splitDropdownOpen?'rotate(180deg)':'none'}}>&#9660;</span>
        </button>
        {splitDropdownOpen && (
          <div className="gdash-split-dropdown" style={{position:'absolute',zIndex:11,background:'#fff',boxShadow:'0 2px 12px rgba(78,84,200,0.08)',borderRadius:8,marginTop:4,minWidth:'100%',padding:'0.25rem 0.1rem'}} role="listbox">
            {splitOptions.map(opt=>(
              <label key={opt.value} className="gdash-split-option" style={{display:'flex',alignItems:'center',gap:'0.65rem',padding:'0.55rem 0.9rem 0.55rem 0.7rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'1.07rem',fontWeight:500,background:form.splitOption===opt.value?'#eef0ff':'#f7f7fa',border:form.splitOption===opt.value?'1.5px solid #8f94fb':'1.5px solid transparent',marginBottom:2}}>
                <input
                  type="radio"
                  name="splitOption"
                  value={opt.value}
                  checked={form.splitOption===opt.value}
                  onChange={()=>handleSplitOption(opt.value)}
                  style={{accentColor:'#667eea',marginRight:6}}
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </label>
  </div>
);

export default SplitOptionSelector;
