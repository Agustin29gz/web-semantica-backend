import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const localEndpoint = 'http://localhost:3030/ds/sparql';

app.get('/api/local', async (req, res) => {
  try {
    const query = `
      SELECT ?subject ?predicate ?object WHERE {
        ?subject ?predicate ?object
      } LIMIT 10
    `;

    const response = await fetch(localEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        Accept: 'application/json',
      },
      body: query,
    });

    if (!response.ok) {
      throw new Error(`SPARQL query failed with status ${response.status}`);
    }

    const data = await response.json();

    const results = data.results.bindings.map((binding) => ({
      subject: binding.subject?.value,
      predicate: binding.predicate?.value,
      object: binding.object?.value,
    }));

    res.json(results);
  } catch (error) {
    console.error('Error executing SPARQL query:', error);
    res.status(500).json({ message: 'Error executing query', error: error.message });
  }
});

app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;

    const response = await fetch(localEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        Accept: 'application/json',
      },
      body: query,
    });

    if (!response.ok) {
      throw new Error(`SPARQL query failed with status ${response.status}`);
    }

    const data = await response.json();

    const results = data.results.bindings.map((binding) => ({
      subject: binding.subject?.value,
      predicate: binding.predicate?.value,
      object: binding.object?.value,
    }));

    res.json(results);
  } catch (error) {
    console.error('Error executing SPARQL query:', error.message, error.stack);
    res.status(500).json({ message: 'Error executing query', error: error.message });
  }
});


app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
