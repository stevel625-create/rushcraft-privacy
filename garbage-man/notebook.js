const {CLUES}=require('./game');
function searchable(text){return String(text).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[’']/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
function findNotes(ids,query='',newestFirst=false){
 const terms=searchable(query).split(/\s+/).filter(Boolean);
 const notes=[...new Set(Array.isArray(ids)?ids:[])].filter(id=>Object.hasOwn(CLUES,id)).map(id=>({id,...CLUES[id]}));
 const found=notes.filter(note=>{const text=searchable(`${note.title} ${note.type} ${note.text}`);return terms.every(term=>text.includes(term));});
 return newestFirst?found.reverse():found;
}
module.exports={findNotes};
