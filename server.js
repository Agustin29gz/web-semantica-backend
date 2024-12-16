import fetch from 'node-fetch';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const localEndpoint = 'http://localhost:3030/ds/sparql';
const localUpdateEndpoint = 'http://localhost:3030/ds/update';
const dbpediaEndpoint = 'https://dbpedia.org/sparql';

const insertToOntology = async (triples) => {
  const sparqlInsert = `
    PREFIX : <http://www.semanticweb.org/cyrixcomp/ontologies/2024/8/untitled-ontology-2#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    INSERT DATA {
      ${triples.join('\n')}
    }
  `;
  
  console.log("SPARQL Query to Insert:", sparqlInsert); // Log para depuración

  const response = await fetch(localUpdateEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sparql-update' },
    body: sparqlInsert,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to insert triples: ${response.statusText} - ${errorText}`);
    throw new Error(`Failed to insert triples: ${response.statusText} - ${errorText}`);
  }
};


// Endpoint para insertar datos de Samsung
app.get('/api/map-samsung', async (req, res) => {
  try {
    const triples = [
      `<http://dbpedia.org/resource/Samsung_E1170> a :Celular ;`,
      `:Nombre "Samsung E1170"^^xsd:string ;`,
      `:fabricante "Samsung Mobile"^^xsd:string ;`,
      `:tieneBateria "Li-ion 1000 mAh"^^xsd:string ;`,
      `:tieneTipoCelular :esFeaturePhone .`,
    ];

    await insertToOntology(triples);
    res.status(200).json({ message: 'Datos de Samsung insertados exitosamente' });
  } catch (error) {
    console.error('Error inserting Samsung data:', error.message);
    res.status(500).json({ message: 'Error inserting Samsung data', error: error.message });
  }
});

app.get('/api/map-iphone14', async (req, res) => {
  try {
    const triples = [
      `<http://dbpedia.org/resource/IPhone_14> a :Celular ;`,
      `:Nombre "iPhone 14"^^xsd:string ;`,
      `:fabricante "Apple Inc."^^xsd:string ;`,
      `:tieneBateria "MagSafe wireless charging, Qi wireless charging"^^xsd:string ;`,
      `:fechaLanzamiento "2022-09-16T00:00:00"^^xsd:dateTime ;`,
      `:tieneSistemaOperativo :iOS16 ;`, // Asegúrate de que iOS16 exista en tu ontología
      `:tienePantalla "6.1 pulgadas, OLED"^^xsd:string ;`,
      `:tieneProcesador :AppleA15 ;`, // Asegúrate de que AppleA15 exista
      `:tieneTipoCelular :esSmartPhone .` // Referencia al tipo de celular Smartphone
    ];

    const sparqlInsert = `
      PREFIX : <http://www.semanticweb.org/cyrixcomp/ontologies/2024/8/untitled-ontology-2#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      INSERT DATA {
        ${triples.join('\n')}
      }
    `;

    console.log("SPARQL Query to Insert:", sparqlInsert); // Log para depuración

    const response = await fetch(localUpdateEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sparql-update' },
      body: sparqlInsert,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to insert triples: ${response.statusText} - ${errorText}`);
      throw new Error(`Failed to insert triples: ${response.statusText} - ${errorText}`);
    }

    res.status(200).json({ message: 'Datos de iPhone 14 insertados correctamente' });
  } catch (error) {
    console.error('Error inserting iPhone 14 data:', error.message);
    res.status(500).json({ message: 'Error inserting iPhone 14 data', error: error.message });
  }
});



app.get('/api/dbpedia-mobile-phone', async (req, res) => {
  try {
    const query = `
      SELECT ?predicate ?object
      WHERE {
        <http://dbpedia.org/resource/Mobile_phone> ?predicate ?object .
      }
    `;

    const response = await fetch(dbpediaEndpoint, {
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
      predicate: binding.predicate.value,
      object: binding.object.value,
    }));

    res.json(results);
  } catch (error) {
    console.error('Error executing DBpedia SPARQL query:', error.message);
    res.status(500).json({ message: 'Error executing query', error: error.message });
  }
});


app.get('/api/local', async (req, res) => {
  try {
    const query = `
      SELECT ?subject ?predicate ?object WHERE {
        ?subject ?predicate ?object
      } LIMIT 100
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

app.post('/api/keyword-search', async (req, res) => {
  try {
    const { keywords } = req.body;

    const query = `
      SELECT ?subject ?predicate ?object WHERE {
        ?subject ?predicate ?object.
        FILTER(CONTAINS(LCASE(STR(?object)), "${keywords.toLowerCase()}") ||
               CONTAINS(LCASE(STR(?subject)), "${keywords.toLowerCase()}") ||
               CONTAINS(LCASE(STR(?predicate)), "${keywords.toLowerCase()}"))
      } LIMIT 100
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
    console.error('Error executing SPARQL query:', error.message);
    res.status(500).json({ message: 'Error executing query', error: error.message });
  }
});


app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
