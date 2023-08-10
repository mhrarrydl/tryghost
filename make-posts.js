const GhostAdminAPI = require('@tryghost/admin-api');

const api = new GhostAdminAPI({
  url: 'https://arch.ghost.is',
  key: '64b51e7191e2c20001b7bcc2:fa19a6838cde0c60ce4e463eb7e79a69dd433c9a8750644dba2dbaf940b71d58',
  version: 'v5.4'
});

const titles = [
'Episode 3 - Nasi Goreng Nights: The National Dish of Indonesia',
'Episode 4 - Rendang Rapture: The World’s Most Delicious Food',
'Episode 5 - Exploring East Java: The Tale of Tempeh',
'Episode 6 - Bountiful Bali: Seafood and Sambal Matah',
'Episode 7 - The Padang Plate: Minangkabau Culinary Wonders',
'Episode 8 - Sumptuous Soto: A Soup for Every Occasion',
'Episode 9 - The Mystique of Mie Goreng: Noodles Redefined',
'Episode 10 - Delving into Desserts: Delights of Dadar Gulung',
'Episode 11 - Unveiling Ubud: A Vegan Paradise',
'Episode 12 - Craving Krupuk: Indonesia’s Beloved Crackers',
'Episode 13 - Martabak Mania: The Sweet and Savory Indulgence',
'Episode 14 - Batik and Bakso: Art and Appetite',
'Episode 15 - Nasi Kuning Tales: The Turmeric Tinted Treat',
'Episode 16 - Indonesian Street Food: The Wonders of Warung',
'Episode 17 - Babi Guling Bliss: Bali’s Roasted Delight',
'Episode 18 - Spices of the Spice Islands: Flavors of Indonesia',
'Episode 19 - Festive Feasts: Celebrations with Tumpeng',
'Episode 20 - The Bountiful Bento: Indonesian-Style Lunch Boxes'
]

		api.posts.add({
			title: titles[0]
		})
/*
titles.reduce((promise, title) => {
console.log({title});
	return promise.then(() => 
		api.posts.add({
			title
		})
	);
}, Promise.resolve());

*/
