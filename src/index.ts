import iarnaToml from '@iarna/toml'
import ltdjToml from '@ltd/j-toml'
import ini from 'ini'
import * as politeJson from 'polite-json'
import * as smolToml from 'smol-toml'
import yaml from 'yaml'
import * as jsYaml from 'js-yaml'

import { mkdirSync, readFileSync, writeFileSync } from 'fs'

// get the initial data object, vltpkg's monorepo pnpm lock
const bigObject = yaml.parse(readFileSync('pnpm-lock.yaml', 'utf8'))

type Case = {
  name: string
  ext: string
  parse: (s: string) => any
  stringify: (o: any) => string
}

const cases: Record<string, Case> = {
  'iarna-toml': {
    name: '@iarna/toml',
    ext: '.toml',
    parse: s => iarnaToml.parse(s),
    stringify: o => iarnaToml.stringify(o),
  },
  'ltd-j-toml': {
    name: '@ltd/j-toml',
    ext: '.toml',
    parse: s => ltdjToml.parse(s),
    // the types on this one lie
    stringify: o =>
      (ltdjToml.stringify(o) as unknown as string[])
        .join('\n')
        .trim() + '\n',
  },
  'smol-toml': {
    name: 'smol-toml',
    ext: '.toml',
    parse: s => smolToml.parse(s),
    stringify: o => smolToml.stringify(o),
  },
  yaml: {
    name: 'yaml',
    ext: '.yaml',
    parse: s => yaml.parse(s),
    stringify: o => yaml.stringify(o),
  },
  'js-yaml': {
    name: 'js-yaml',
    ext: '.yaml',
    parse: s => jsYaml.load(s),
    stringify: o => jsYaml.dump(o),
  },
  'polite-json': {
    name: 'polite-json',
    ext: '.json',
    parse: s => politeJson.parse(s),
    stringify: o => politeJson.stringify(o, null, 2),
  },
  'native-json': {
    name: 'JSON (the built-in one)',
    ext: '.json',
    parse: s => JSON.parse(s),
    stringify: o => JSON.stringify(o, null, 2),
  },
  ini: {
    name: 'ini',
    ext: '.ini',
    parse: s => ini.parse(s),
    stringify: o => ini.stringify(o),
  },
} as const

const results: Record<keyof typeof cases, string> = {}

// make examples of all of these.
mkdirSync('output', { recursive: true })
for (const [name, { ext, stringify }] of Object.entries(cases)) {
  console.error('generating example:', name)
  let result: string | undefined = undefined
  try {
    result = stringify(bigObject)
    results[name] = result
    writeFileSync(`output/${name}${ext}`, result)
  } catch (er) {
    console.error('failed', (er as Error).message, result)
  }
}

// gut-check, parse all the examples from same language
for (const [name, { ext, parse }] of Object.entries(cases)) {
  for (const other of Object.keys(cases).filter(
    o => o !== name && cases[o]?.ext === ext,
  )) {
    const otherResult = results[other]
    if (!otherResult) continue
    try {
      parse(otherResult)
    } catch (e) {
      console.error(`${name} could not parse output from ${other}`, e)
    }
  }
}

console.log('examples generated, running benchmarks')
console.log('bigger number is better, ops / ms')

const duration = 1000
const test = (fn: (...a: any[]) => any) => {
  const start = performance.now()
  let count = 0
  while (performance.now() < start + duration) {
    fn()
    count++
  }
  const end = performance.now()
  const q = count / (end - start)
  return Math.floor(q * 1000) / 1000
}

for (const [name, c] of Object.entries(cases)) {
  console.log(`\n# ${c.name}`)
  console.log(
    '> stringify',
    test(() => c.stringify(bigObject)),
  )
  const result = results[name]
  if (result) {
    console.log(
      '> parse    ',
      test(() => c.parse(result)),
    )
  }
}
