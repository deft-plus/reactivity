// Copyright the Deft+ authors. All rights reserved. Apache-2.0 license

import { describe as group, test } from '@std/testing/bdd';
import { expect } from '@std/expect';

import { delay } from '@std/async/delay';

import { store } from './store.ts';

group('reactive / store()', () => {
  type CounterStore = {
    count: number;
    increment: () => void;
    decrement: () => void;
    reset: () => void;
    doubleCount: number;
    name: string;
  };

  const counterStore = store<CounterStore>(({ get }) => ({
    count: 0,
    increment: () => get().count.update((count) => count + 1),
    decrement: () => get().count.update((count) => count - 1),
    reset: () => get().count.set(0),
    doubleCount: {
      value: () => get().count() * 2,
    },
    name: {
      value: 'Counter',
    },
  }));

  test('should create basic store and access values, actions and computed values', () => {
    const counter = counterStore();

    expect(counter.count()).toBe(0);

    counter.increment();
    expect(counter.count()).toBe(1);

    counter.decrement();
    expect(counter.count()).toBe(0);

    counter.increment();
    counter.increment();
    expect(counter.count()).toBe(2);
    expect(counter.doubleCount()).toBe(4);

    counter.reset();
    expect(counter.count()).toBe(0);

    expect(counter.name()).toBe('Counter');
  });

  test('should allow to configure signals', () => {
    const changes: number[] = [];

    const configuredCounterStore = store<CounterStore>(({ get }) => ({
      name: 'Counter',
      count: {
        value: 0,
        name: 'count',
        log: true,
        equal: (a, b) => a === b,
        subscribe: (value) => changes.push(value),
      },
      increment: () => get().count.update((count) => count + 1),
      decrement: () => get().count.update((count) => count - 1),
      reset: () => get().count.set(0),
      doubleCount: { value: () => get().count() * 2 },
    }));

    const counter = configuredCounterStore();

    counter.increment();
    counter.increment();
    counter.increment();

    expect(changes).toStrictEqual([1, 2, 3]);
  });

  test('should allow using the selector to access specific store values and actions', () => {
    const count = counterStore('count');
    const increment = counterStore('increment');

    expect(count()).toBe(0);

    increment();
    expect(count()).toBe(1);

    increment();
    expect(count()).toBe(2);
  });

  test('should allow to use promises', async () => {
    type User = {
      uid: string;
      username: string;
      password: string;
    };

    const mockedUsers: User[] = [];

    const UserService = {
      create: async (username: string, password: string) => {
        await delay(5);
        const user = { uid: `${mockedUsers.length + 1}`, username, password };
        mockedUsers.push(user);
        return user;
      },
      read: async (username: string) => {
        await delay(5);
        const user = mockedUsers.find((user) => user.username === username);
        return user ?? null;
      },
      update: async (uid: string, username: string, password: string) => {
        await delay(5);
        const user = mockedUsers.find((user) => user.uid === uid);
        if (user) {
          user.username = username;
          user.password = password;
        }
        return user ?? null;
      },
      delete: async (uid: string) => {
        await delay(5);
        const user = mockedUsers.find((user) => user.uid === uid);
        if (user) {
          mockedUsers.splice(mockedUsers.indexOf(user), 1);
        }
        return user ?? null;
      },
    };

    type AuthStore = {
      user: User | null;
      uid: string | null;
      signUp: (username: string, password: string) => Promise<User>;
      signIn: (username: string, password: string) => Promise<User | null>;
      signOut: () => Promise<boolean>;
    };

    const authenticationStore = store<AuthStore>(({ get }) => ({
      user: null,
      uid: {
        value: () => get().user()?.uid ?? null, // uid is a derived value from user.
      },
      signIn: async (username, password) => {
        const userSignedIn = await UserService.read(username);
        if (userSignedIn?.password !== password) {
          get().user.set(null);
          return null;
        }
        get().user.set(userSignedIn);
        return userSignedIn;
      },
      signOut: async () => {
        await delay(5);
        get().user.set(null);
        return true;
      },
      signUp: async (username, password) => {
        const newUser = await UserService.create(username, password);

        get().user.set(newUser);

        return newUser;
      },
    }));

    const auth = authenticationStore();
    expect(auth.uid()).toBe(null);

    await auth.signUp('username', 'password');
    expect(auth.uid()).toBe('1');

    await auth.signOut();
    expect(auth.uid()).toBe(null);

    await auth.signIn('username', 'password');
    expect(auth.uid()).toBe('1');
    expect(auth.user()).toStrictEqual({ uid: '1', username: 'username', password: 'password' });

    await auth.signOut();
    expect(auth.uid()).toBe(null);
    expect(auth.user()).toBe(null);
  });
});
