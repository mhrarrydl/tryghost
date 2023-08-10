const URL = 'https://arch.ghost.is/';
const AdminApiKey = '64b51e7191e2c20001b7bcc2:fa19a6838cde0c60ce4e463eb7e79a69dd433c9a8750644dba2dbaf940b71d58';

//const URL = 'http://localhost:2368/';
//const AdminApiKey = '648081eea1e4af2fc0fd26a1:1768b643b8ff236c395311aec3eca57f600e78ec40e74ffba73a8fec661e2ef7';

async function main() {
    //await deleteCollection('64b67e5e665877000112d351');
    //await deleteCollection('64b900cf68799eb04a995afe');
    await createAutomaticCollection('Podcast Two', `tags:podcast`);
}

main();

function generateAuthHeader(key) {
    const jwt = require('jsonwebtoken');
    const [id, secret] = key.split(':');

    const token = jwt.sign({}, Buffer.from(secret, 'hex'), { // eslint-disable-line no-undef
        keyid: id,
        algorithm: 'HS256',
        expiresIn: '5m',
        audience: '/admin/'
    });
    return {
        Authorization: `Ghost ${token}`
    };
}

async function getPosts() {
    const res = await fetch(`${URL}ghost/api/admin/posts/?god_mode=true`, {
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.posts;;
}

async function getPostWithCollections(id) {
    const res = await fetch(`${URL}ghost/api/admin/posts/${id}/?include=collections&god_mode=true`, {
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.posts[0];
}

async function getCollections() {
    const res = await fetch(`${URL}ghost/api/admin/collections/?god_mode=true`, {
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.collections;
}

async function deleteCollection(id) {
    const res = await fetch(`${URL}ghost/api/admin/collections/${id}/?god_mode=true`, {
        method: 'DELETE',
        headers: generateAuthHeader(AdminApiKey)
    });

    return null;
}

async function getCollection(id) {
    const res = await fetch(`${URL}ghost/api/admin/collections/${id}/?god_mode=true`, {
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.collections[0];
}

async function createManualCollection(title) {
    const res = await fetch(`${URL}ghost/api/admin/collections/?god_mode=true`, {
        method: 'POST',
        body: JSON.stringify({
            collections: [{
                title,
                type: 'manual'
            }]
        }),
        headers: {
            ...generateAuthHeader(AdminApiKey),
            'Content-Type': 'application/json'
        }
    });

    const data = await res.json();

    return data.collections[0];
}

async function createAutomaticCollection(title, filter) {
    const res = await fetch(`${URL}ghost/api/admin/collections/?god_mode=true`, {
        method: 'POST',
        body: JSON.stringify({
            collections: [{
                title,
                filter,
                type: 'automatic'
            }]
        }),
        headers: {
            ...generateAuthHeader(AdminApiKey),
            'Content-Type': 'application/json'
        }
    });

    const data = await res.json();

    return data.collections[0];
}

async function addPostsToManualCollection(id, postIds) {
    console.log(id);
    const res = await fetch(`${URL}ghost/api/admin/collections/${id}/?god_mode=true&force_params=true`, {
        method: 'POST',
        body: JSON.stringify({
            collections: [{
                posts: postIds.map(id => ({id}))
            }]
        }),
        headers: {
            ...generateAuthHeader(AdminApiKey),
            'Content-Type': 'application/json'
        }
    });

    const data = await res.json();

    console.log(data);

    return data.collections[0];
}

async function removePostFromManualCollection(id, postId) {
    const res = await fetch(`${URL}ghost/api/admin/collections/${id}/posts/${postId}/?god_mode=true`, {
        method: 'DELETE',
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.collections[0];
}
