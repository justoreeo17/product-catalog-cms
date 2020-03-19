const { Keystone } = require('@keystonejs/keystone');
const { PasswordAuthStrategy } = require('@keystonejs/auth-password');
const { Text, Checkbox, Password } = require('@keystonejs/fields');
const { GraphQLApp } = require('@keystonejs/app-graphql');
const { AdminUIApp } = require('@keystonejs/app-admin-ui');
const initialiseData = require('./initial-data');
const { File } = require('@keystonejs/fields');
const { LocalFileAdapter } = require('@keystonejs/file-adapters');

const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose');

const PROJECT_NAME = "product-catalog-cms";


const keystone = new Keystone({
	name: PROJECT_NAME,
	adapter: new Adapter(),
	onConnect: initialiseData,
});

// Access control functions
const userIsAdmin = ({ authentication: { item: user } }) => Boolean(user && user.isAdmin);
const userOwnsItem = ({ authentication: { item: user } }) => {
	if (!user) {
		return false;
	}
	return { id: user.id };
};
const userIsAdminOrOwner = auth => {
	const isAdmin = access.userIsAdmin(auth);
	const isOwner = access.userOwnsItem(auth);
	return isAdmin ? isAdmin : isOwner;
};
const access = { userIsAdmin, userOwnsItem, userIsAdminOrOwner };

keystone.createList('User', {
	fields: {
		name: { type: Text },
		email: {
			type: Text,
			isUnique: true,
		},
		isAdmin: { type: Checkbox },
		password: {
			type: Password,
		},
	},
	access: {
		read: access.userIsAdminOrOwner,
		update: access.userIsAdminOrOwner,
		create: access.userIsAdmin,
		delete: access.userIsAdmin,
		auth: true,
	},
});

const fileAdapter = new LocalFileAdapter({
	/*...config */
	src: './files',
	path: './files',
});

// List of products
keystone.createList('Product', {
	fields: {
		file: {
			type: File,
			adapter: fileAdapter,
		},
		name: { type: Text },
		desc: { type: Text },
		price: { type: Text },
	}
})

const authStrategy = keystone.createAuthStrategy({
	type: PasswordAuthStrategy,
	list: 'User',
});

module.exports = {
	keystone,
	apps: [
		new GraphQLApp(),
		new AdminUIApp({
		enableDefaultRoute: true,
		authStrategy,
		}),
	],
};
