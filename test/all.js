const test = require('tape')

const ram = require('random-access-memory')
const hypertrie = require('hypertrie')
const Graph = require('..')

test('single-level one-label graph traversal for a single key', async t => {
  const trie = hypertrie(ram)
  const graph = new Graph(trie)

  await simpleGraph(graph)

  const ite = graph.iterator({ from: 'a', label: 'parent', depth: 1 })
  await validate(t, ite, [['a', 'b'], ['a', 'd']])

  t.end()
})

test('multi-level one-label graph traversal for a single key', async t => {
  const trie = hypertrie(ram)
  const graph = new Graph(trie)

  await simpleGraph(graph)

  const ite = graph.iterator({ from: 'a', label: 'parent' })
  await validate(t, ite, [['a', 'b'], ['a', 'd'], ['b', 'c']])

  t.end()
})

test('can get all edges with a given label', async t => {
  const trie = hypertrie(ram)
  const graph = new Graph(trie)

  await simpleGraph(graph)

  const ite = graph.iterator({ label: 'parent', depth: 1 })
  await validate(t, ite, [['a', 'b'], ['b', 'c'], ['a', 'd'], ['e', 'f']])

  t.end()
})

test('cycles are handled correctly', async t => {
  const trie = hypertrie(ram)
  const graph = new Graph(trie)

  await cyclicGraph(graph)

  const ite = graph.iterator({ from: 'a', label: 'parent' })
  await validate(t, ite, [['a', 'b'], ['b', 'c'], ['c', 'a']])

  t.end()
})

test('deletions work correctly', async t => {
  const trie = hypertrie(ram)
  const graph = new Graph(trie)

  await simpleGraph(graph)

  var ite = graph.iterator({ label: 'parent', depth: 1 })
  await validate(t, ite, [['a', 'b'], ['b', 'c'], ['a', 'd'], ['e', 'f']])

  await graph.del('a', 'd', 'parent')

  ite = graph.iterator({ label: 'parent', depth: 1 })
  await validate(t, ite, [['a', 'b'], ['b', 'c'], ['e', 'f']])

  t.end()
})

async function simpleGraph (graph) {
  await graph.put('a', 'b', 'parent')
  await graph.put('b', 'a', 'child')
  await graph.put('b', 'c', 'parent')
  await graph.put('c', 'b', 'child')
  await graph.put('a', 'd', 'parent')
  await graph.put('d', 'a', 'child')
  await graph.put('e', 'f', 'parent')
  await graph.put('f', 'e', 'child')
}

async function cyclicGraph (graph) {
  await graph.put('a', 'b', 'parent')
  await graph.put('b', 'c', 'parent')
  await graph.put('c', 'a', 'parent')
}

async function validate (t, ite, expected) {
  const expectedSet = new Set(expected.map(([a, b]) => pairToKey(a, b)))
  var seen = 0

  return new Promise(resolve => {
    ite.next(function onnext (err, pair) {
      t.error(err, 'no error')
      if (!pair) {
        t.same(seen, expectedSet.size)
        return resolve()
      }
      const { from, to } = pair
      t.true(expectedSet.has(pairToKey(from, to)))
      seen++
      return ite.next(onnext)
    })
  })
}

function pairToKey (a, b) {
  return `${a}-${b}`
}
