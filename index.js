addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  
  const url = new URL(request.url);
  if (url.pathname === '/items') {
    switch (request.method) {
      case 'GET': {
        const result = await listItems();
        return new Response(result, {
          headers: { 'content-type': 'text/plain' },
        });
      }
      case 'POST': {
        const result = await addRandomItem();
        return new Response(result, {
          headers: { 'content-type': 'text/plain' },
        });
      }
      default: throw new Error('Unsupported METHOD');
    }
  } else {
    const result = await incr();
    return new Response(result, {
      headers: { 'content-type': 'text/plain' },
    });
  }

}

async function listItems() {
  return postUpstash(['LRANGE', 'items', 0, 100]).then(res => res.text());
}

async function addRandomItem() {
  return postUpstash(['RPUSH', 'items', Math.random()]).then(res => res.text());
}

async function incr() {
  return postUpstash(['INCR', 'counter']).then(res => res.text());
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
  });
}