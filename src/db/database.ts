import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('zajtistics.db');

export interface UserProfile {
  id: number;
  name: string | null;
  profile_pic_uri: string | null;
}

export function setupDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT,
      profile_pic_uri TEXT
    );
  `);
  
  // Seed the first user if none exists
  const firstUser = db.getFirstSync<UserProfile>('SELECT * FROM users LIMIT 1');
  if (!firstUser) {
    db.runSync('INSERT INTO users (name, profile_pic_uri) VALUES (?, ?)', ['User', null]);
  }
}

export function getUserProfile(): UserProfile | null {
  return db.getFirstSync<UserProfile>('SELECT * FROM users LIMIT 1');
}

export function updateUserProfile(name: string, profilePicUri: string | null) {
  const user = getUserProfile();
  if (user) {
    db.runSync('UPDATE users SET name = ?, profile_pic_uri = ? WHERE id = ?', [name, profilePicUri, user.id]);
  }
}
