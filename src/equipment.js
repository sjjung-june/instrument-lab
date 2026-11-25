export const EQUIPMENT=['AFM','APT','FIB','SAM','SEM','SIMS','TEM','XPS','XRD'].map(name=>({name,id:name.toLowerCase(),button:'select'+name[0]+name.slice(1).toLowerCase()}));
