// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_wide_spyke.sql';
import m0001 from './0001_adorable_fabian_cortez.sql';
import m0002 from './0002_spooky_tiger_shark.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002
    }
  }
  