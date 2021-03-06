import { expect, test, jest } from '@jest/globals';
import axios from 'axios';
import { User } from './User';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

test('creating user', () => {
  const user = User.buildUser({ name: 'John', age: 27 });
  expect(user.get('name')).toBe('John');
  expect(user.get('age')).toBe(27);
});

test('update user', () => {
  const user = User.buildUser({ name: 'John', age: 27 });
  user.set({ name: 'Alex', age: 28 });

  expect(user.get('name')).toBe('Alex');
  expect(user.get('age')).toBe(28);
});

test('update user one field', () => {
  const user = User.buildUser({ name: 'John', age: 27 });
  user.set({ name: 'Alex' });

  expect(user.get('name')).toBe('Alex');
});

test('uninitialized user', () => {
  const user = User.buildUser({});
  expect(user.get('name')).toBeUndefined();
});

test('add event to user', (done) => {
  const user = User.buildUser({});
  user.on('some action', () => done());
  user.trigger('some action');
});

test('trigger one event on user', () => {
  const user = User.buildUser({});
  const mockCallback = jest.fn();

  user.on('change', mockCallback);
  user.trigger('change');
  user.trigger('change');

  expect(mockCallback.mock.calls).toHaveLength(2);
});

test('trigger multiple events on user', () => {
  const user = User.buildUser({});
  const mockCallback1 = jest.fn();
  const mockCallback2 = jest.fn();

  user.on('change', mockCallback1);
  user.on('change', mockCallback2);
  user.trigger('change');

  expect(mockCallback1.mock.calls).toHaveLength(1);
  expect(mockCallback2.mock.calls).toHaveLength(1);
});

test('event of other type not triggers on user', () => {
  const user = User.buildUser({});
  const mockCallback = jest.fn();

  user.on('change', mockCallback);
  user.trigger('click');

  expect(mockCallback.mock.calls).toHaveLength(0);
});

test('event change fired on set call', () => {
  const user = User.buildUser({ name: 'John', age: 27 });
  const mockCallback = jest.fn();

  user.on('change', mockCallback);
  user.set({ name: 'Alex', age: 29 });
  user.set({ name: 'Alex', age: 30 });

  expect(mockCallback.mock.calls).toHaveLength(2);
});

test('user correct fetch', () => {
  const user = User.buildUser({ id: 1 });

  user.on('change', () => {
    expect(user.get('name')).toBe('John');
    expect(user.get('age')).toBe(28);
  });

  mockedAxios.get.mockResolvedValue({ data: { id: 1, name: 'John', age: 28 } });
  user.fetch();

  expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3000/users/1');
});

test('user try to fetch without id', () => {
  const user = User.buildUser({});

  expect(() => user.fetch()).toThrowError();
});

test('new user correct save', (done) => {
  const data = { name: 'John', age: 28 };
  const dataWithID = { id: 6, ...data };
  const user = User.buildUser(data);
  mockedAxios.post.mockResolvedValue({ data: dataWithID });

  user.on('change', () => {
    try {
      expect(user.get('id')).toBe(6);
      expect(user.get('name')).toBe('John');
      expect(user.get('age')).toBe(28);
      done?.();
    } catch (error) {
      done?.(error);
    }
  });
  user.save();

  expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/users', data);
});

test('user with id correct save ', (done) => {
  const data = { id: 6, name: 'John', age: 28 };
  const user = User.buildUser(data);
  mockedAxios.put.mockResolvedValue({ data });

  user.on('change', () => {
    try {
      expect(user.get('id')).toBe(6);
      expect(user.get('name')).toBe('John');
      expect(user.get('age')).toBe(28);
      done?.();
    } catch (error) {
      done?.(error);
    }
  });
  user.save();

  expect(mockedAxios.put).toHaveBeenCalledWith('http://localhost:3000/users/6', data);
});

test('user with id correct save', (done) => {
  const data = { id: 6, name: 'John', age: 28 };
  const user = User.buildUser(data);
  mockedAxios.put.mockRejectedValue({ data: { detail: 'error' } });

  user.on('error', () => {
    done?.();
  });
  user.save();
});

test('build user collection', (done) => {
  const collection = User.buildUserCollection();
  mockedAxios.get.mockResolvedValue({
    data: [{ id: 1, name: 'John', age: 28 }, { id: 2, name: 'Alex', age: 23 }],
  });

  collection.on('change', () => {
    expect(collection.models[0].get('name')).toBe('John');
    expect(collection.models[1].get('name')).toBe('Alex');
    done?.();
  });
  collection.fetch();
});
