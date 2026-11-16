const id = name => document.getElementById(name);
const make = (tag, text, css = '') => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (css) element.className = css;
  return element;
};
const link = (href, title) => {
  const element = make('a', title);
  element.href = href;
  return element;
};
let devices = [];
let results = [];
let selected;
const collapse = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const csv = value => {
  const text = String(value || '');
  return '"' + (/^[\t\r\n]|^\s*[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"';
};

function inspect(device, focus = false) {
  selected = device;
  const detail = id('detail');
  if (!device) {
    history.replaceState(null, '', location.pathname + location.search);
    detail.replaceChildren(make('p', 'No devices match these filters. Try the FCC search for other authorizations.', 'muted'),
      link('https://www.fcc.gov/oet/ea/fccid', 'Official FCC lookup'));
    return;
  }
  history.replaceState(null, '', '#' + encodeURIComponent(device.id));
  detail.replaceChildren(make('p', `FCC ID · ${device.id}`, 'meta'), make('h2', device.name),
    make('p', `${device.maker} · ${device.category}`, 'meta'), make('p', device.summary));
  const pairs = make('dl');
  for (const [name, value] of [['Equipment description on filing', device.deviceClass], ['Latest date in reviewed index', device.date]]) {
    if (value) pairs.append(make('dt', name), make('dd', value));
  }
  detail.append(pairs);
  const sources = make('p');
  sources.append(link('https://www.fcc.gov/oet/ea/fccid', 'FCC lookup instructions'), ' · ', link(device.index, 'Full exhibit index (independent)'));
  detail.append(sources);
  const chosen = id('type').value;
  const files = device.exhibits.filter(exhibit => !chosen || exhibit.kind === chosen);
  if (!files.length) detail.append(make('p', 'No matching public files in this selection.', 'notice'));
  for (const kind of new Set(files.map(exhibit => exhibit.kind))) {
    const section = make('section', undefined, 'data-block');
    const items = make('ul');
    for (const exhibit of files.filter(exhibit => exhibit.kind === kind)) {
      const row = make('li');
      const date = exhibit.available ? ` · ${exhibit.available}` : '';
      const title = make('p', exhibit.title);
      const paths = make('p');
      paths.append(make('span', `Exhibit ${exhibit.id}${date} · `, 'meta'),
        link(exhibit.official, 'FCC original'), ' · ', link(exhibit.mirror, 'Independent reference'));
      row.append(title, paths);
      items.append(row);
    }
    section.append(make('h3', kind), items);
    detail.append(section);
  }
  if (focus) detail.focus();
}

function render() {
  const container = id('results');
  container.replaceChildren();
  for (const device of results) {
    const button = make('button', device.name, 'result');
    button.type = 'button';
    button.setAttribute('aria-current', String(device === selected));
    button.append(make('span', `${device.id} · ${device.category}`));
    button.addEventListener('click', () => {
      inspect(device, matchMedia('(max-width: 760px)').matches);
      for (const item of container.querySelectorAll('button')) item.setAttribute('aria-current', String(item === button));
    });
    const row = make('li');
    row.append(button);
    container.append(row);
  }
  id('message').textContent = `${results.length} of ${devices.length} curated devices`;
  id('count').textContent = results.length;
  id('export').disabled = !results.length;
}

function filter(preferred = selected) {
  const query = id('query').value.trim().replace(/^FCC\s+ID\s*[:#]?\s*/i, '');
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const category = id('category').value;
  const type = id('type').value;
  results = devices.filter(device => (!category || device.category === category)
    && (!type || device.exhibits.some(exhibit => exhibit.kind === type))
    && (!words.length || words.every(word => device.search.includes(word)) || (collapse(query) && collapse(device.id).includes(collapse(query)))));
  inspect(results.includes(preferred) ? preferred : results[0]);
  render();
}

for (const field of ['query','category','type']) id(field).addEventListener('input', () => filter());
id('reset').addEventListener('click', () => {
  for (const field of ['query','category','type']) id(field).value = '';
  filter();
  id('query').focus();
});
id('export').addEventListener('click', () => {
  const type = id('type').value;
  const rows = [['fcc_id','device','manufacturer','kind','document_id','available','fcc_original','independent_reference']];
  for (const device of results) {
    for (const exhibit of device.exhibits.filter(file => !type || file.kind === type)) {
      rows.push([device.id, device.name, device.maker, exhibit.kind, exhibit.id, exhibit.available, exhibit.official, exhibit.mirror]);
    }
  }
  const url = URL.createObjectURL(new Blob([rows.map(row => row.map(csv).join(',')).join('\r\n')], {type:'text/csv;charset=utf-8'}));
  const download = link(url, '');
  download.download = 'gear-autopsy-exhibits.csv';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
try {
  const response = await fetch('./catalogue.json');
  if (!response.ok) throw Error('Catalogue not available');
  const source = await response.json();
  devices = source.devices.map(device => ({
    ...device,
    search: [device.id, device.name, device.category, device.maker, device.summary, device.deviceClass]
      .join(' ').toLowerCase()
  }));
  for (const category of [...new Set(devices.map(device => device.category))].sort()) {
    id('category').append(new Option(category, category));
  }
  id('source-date').textContent += ` · reviewed ${source.reviewed}`;
  id('controls').disabled = false;
  filter(devices.find(device => location.hash.slice(1).toUpperCase() === device.id)
    || devices.find(device => device.id === '2ABCB-RPI5'));
} catch {
  id('message').textContent = 'The catalogue could not be loaded. Reload or open the official FCC source below.';
}
