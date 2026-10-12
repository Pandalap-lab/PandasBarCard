const destination='https://pandasbarcard.pandanuovo.com/'+(location.pathname.startsWith('/PandasBarCard/admin')?'admin/':'');
// Build an independent URL; never copy queries, fragments, credentials or old sessions.
location.replace(destination+'#');
