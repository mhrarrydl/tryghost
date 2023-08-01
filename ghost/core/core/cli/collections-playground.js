process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// LOCAL
// const AdminApiUrl = 'https://admin.localhost/site';
// const AdminApiKey = '6481eabe76c2fb6568d45c55:b2b1a49c892cde0dd50ceadead5669fc6b8d489e30014c17e5bc48653e97313d';

// ARCH.GHOST.IS
const AdminApiUrl = 'https://arch.ghost.is';
const AdminApiKey = '64b51e7191e2c20001b7bcc2:fa19a6838cde0c60ce4e463eb7e79a69dd433c9a8750644dba2dbaf940b71d58';

async function main() {
    // const posts = await getPosts();
    // console.log('All posts', posts.map(p => p.title));

    // const post = await getPostWithCollections(posts[0].id);

    // console.log('Post without collections');
    // console.log(post);

    const collection = await createAutomaticCollection('Podcast', 'Journey Through Java: An Indonesian Food Podcast', 'tag:hash-podcast');
    console.log('Fetched an automatic collection', collection);

    const collections = await getCollections();
    console.log('All collections');
    console.log(collections);

    // const collection = await createManualCollection('My Collection');
    // console.log('Created a manual collection');
    // console.log(collection);

    // await addPostToManualCollection(collection.id, post.id);
    // {
    //     const post = await getPostWithCollections(posts[0].id);
    //     console.log('Post has a collection now!');
    //     console.log(post);
    // }
    // await removePostFromManualCollection(collection.id, post.id);
    // {
    //     const post = await getPostWithCollections(posts[0].id);
    //     console.log('Post was removed freom the collection!');
    //     console.log(post);
    // }

    // Documentation collection
    // const collectionId = '6492056720d36f6f10517d2e'; // Documentation
    // const collectionId = '649203a720d36f6f10517d2d'; // Featured
    // const collectionId = '649203a720d36f6f10517d2c'; // Index
    // const collection = await getCollection(collectionId);

    //     // const posts = await getPostsWithCollections();
    //     // console.log('posts', posts);
    //     // // console.log('All posts with collections', posts.map(p => `${p.title} (${p.collections.map(c => c.name).join(', ')})`));
    //     // console.log('All posts with collections', posts.map(p => `${p.title}`));

//     const collectionPosts = await getPostsInCollection(collection.id);
//     // console.log('Posts in collection', collectionPosts.map(p => `${p.title} (${p.collections.map(c => c.name).join(', ')})`));
//     console.log('Posts in collection', Object.keys(collectionPosts));
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
    const res = await fetch(`${AdminApiUrl}/ghost/api/admin/posts/?god_mode=true`, {
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.posts;
}

async function getPostWithCollections(id) {
    const res = await fetch(`${AdminApiUrl}/ghost/api/admin/posts/${id}/?include=collections&god_mode=true`, {
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.posts[0];
}

async function getPostsInCollection(id) {
    const res = await fetch(`${AdminApiUrl}/ghost/api/admin/posts/?collection=${id}&god_mode=true`, {
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.posts;
}

async function getPostsWithCollections() {
    const res = await fetch(`${AdminApiUrl}/ghost/api/admin/posts/?include=collections&god_mode=true`, {
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.posts;
}

async function getCollections() {
    const res = await fetch(`${AdminApiUrl}/ghost/api/admin/collections/?god_mode=true`, {
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    console.log('data', data);

    return data.collections;
}

async function getCollection(id) {
    const res = await fetch(`${AdminApiUrl}/ghost/api/admin/collections/${id}/?god_mode=true`, {
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.collections[0];
}

async function createManualCollection(title) {
    const res = await fetch(`${AdminApiUrl}/ghost/api/admin/collections/?god_mode=true`, {
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

async function createAutomaticCollection(title, description, filter) {
    const res = await fetch(`${AdminApiUrl}/ghost/api/admin/collections/?god_mode=true`, {
        method: 'POST',
        body: JSON.stringify({
            collections: [{
                title,
                description,
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

async function addPostToManualCollection(id, postId) {
    const res = await fetch(`${AdminApiUrl}/ghost/api/admin/collections/${id}/posts/?god_mode=true`, {
        method: 'POST',
        body: JSON.stringify({
            posts: [{
                id: postId
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

async function removePostFromManualCollection(id, postId) {
    const res = await fetch(`${AdminApiUrl}/ghost/api/admin/collections/${id}/posts/${postId}/?god_mode=true`, {
        method: 'DELETE',
        headers: generateAuthHeader(AdminApiKey)
    });

    const data = await res.json();

    return data.collections[0];
}
