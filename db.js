import config from './config';

import {MongoClient} from 'mongodb';

const dbPromise = MongoClient.connect(config.dbUrl);

export default dbPromise;
