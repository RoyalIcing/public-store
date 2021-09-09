addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event))
})

const notFound = init => init.status = 404;
const plainText = init => init.headers['content-type'] = 'text/plain';
const json = init => init.headers['content-type'] = 'text/json';
// const notFound = { status: 404 };
// const plainText = { headers: { 'content-type': 'text/plain' } };
// const json = { headers: { 'content-type': 'text/json' } };

/**
 * Respond with hello worker text
 * @param {Request} request
 * @param {Event} event
 */
async function handleRequest(request, event) {
  const headers = new Headers();

  function allowCrossOrigin(origin = '*') {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  function allowMethods(methods) {
    headers.set('Access-Control-Allow-Methods', methods);
  }
  function resPlainText(text, status = 200) {
    headers.set('content-type', 'text/plain');
    return new Response(text, { status, headers });
  }
  function resJSON(json, status = 200) {
    headers.set('content-type', 'application/json');
    return new Response(JSON.stringify(json), { status, headers });
  }
  function resEventStream(stream, status = 200) {
    headers.set('content-type', 'text/event-stream');
    return new Response(stream, { status, headers });
  }
  function resEmpty(status = 204) {
    return new Response(undefined, { status, headers });
  }
  
  const url = new URL(request.url);
  if (url.pathname === '/items') {
    allowCrossOrigin();
    allowMethods('*');
    switch (request.method) {
      case 'OPTIONS': return resEmpty();
      case 'GET': {
        return resJSON(await listItems());
      }
      case 'POST': {
        return resJSON(await addRandomItem());
      }
      case 'DELETE': {
        return resJSON(await removeAllItems());
      }
      default: {
        return resPlainText('Unsupported method', 405);
      }
    }
  } else if (url.pathname === '/items/event-stream') {
    allowCrossOrigin();
    allowMethods('*');

    const items = await listItems();
    const iterator = items[Symbol.iterator]();

    const delay = 1000;
    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const streamPromise = Promise.resolve()
      .then(async function next() {
        await new Promise(resolve => setTimeout(resolve, delay));

        const { value, done } = iterator.next();
        if (done) {
          writer.close();
          return;
        }

        const chunk = `data: ${JSON.stringify(value)}\n\n`;
        await writer.write(encoder.encode(chunk));

        return next();
      });
    
    event.waitUntil(streamPromise);
    return resEventStream(readable);

  } else if (url.pathname.startsWith('/items/')) {
    allowCrossOrigin();
    allowMethods('*');

    switch (request.method) {
      case 'OPTIONS': return resEmpty();
      case 'PUT': {
        const param = url.pathname.replace('/items/', '');
        const index = parseInt(param, 10);
        if (Number.isNaN(index)) {
          return resJSON({ error: `Index ${JSON.stringify(param)} is invalid` }, 400);
        }
    
        return resJSON(await replaceItemWithRandomValue(index));
      }
      default: {
        return resPlainText('Unsupported method', 405);
      }
    }
  } else if (url.pathname === '/incr') {
    return resJSON(await incr());
  }
  
  return resPlainText(`Not found: ${request.url}`, 204);
}

async function listItems() {
  return postUpstash(['LRANGE', 'items', 0, 100]).then(data => data.result.map(parseFloat));
}

async function addRandomItem() {
  return postUpstash(['RPUSH', 'items', Math.random()]);
}

async function replaceItemWithRandomValue(index) {
  return postUpstash(['LSET', 'items', index, Math.random()]);
}

async function removeAllItems() {
  return postUpstash(['DEL', 'items']);
  // return postUpstash(['LTRIM', 'items', -1, 0]);
}

async function incr() {
  return postUpstash(['INCR', 'counter']);
}

/**
 * 
 * @param {Array<string | number>} command 
 * @returns Promise<{ result: any }>
 */
async function postUpstash(command) {
  return await fetch(UPSTASH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${UPSTASH_TOKEN}`
    },
    body: JSON.stringify(command)
  }).then(res => res.json());
}