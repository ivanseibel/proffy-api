import express from 'express';

const app = express();

app.use(express.json());

interface IUser {
  id: string;
  name: string;
}

app.get('/', (request, response) => {
  response.json({ message: 'Hello World' });
});

app.listen(3333, () => {
  // eslint-disable-next-line no-console
  console.log('For the up and follow!');
});
