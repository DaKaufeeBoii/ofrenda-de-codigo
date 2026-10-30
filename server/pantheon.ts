import { DepartedRepo } from '../src/types.js';

export const PANTHEON_REPOSITORIES: DepartedRepo[] = [
  {
    id: 'request',
    name: 'request',
    fullName: 'request/request',
    yearsActive: '2011 – 2020',
    birthYear: 2011,
    deathYear: 2020,
    starsAtSunset: 25400,
    peakWeeklyDownloads: '44,000,000',
    category: 'JavaScript',
    authorOrMaintainer: 'Mikeal Rogers & Community',
    epitaph: 'Simplified HTTP request client. Carried the weight of the early Node.js ecosystem on its callbacks, so that native fetch could walk.',
    obituary: 'For nearly a decade, request was the undisputed heart of network communication in Node.js. With over 40 million weekly downloads, virtually every server on earth depended on it. In February 2020, after years of monumental service, the maintainers gracefully declared it fully deprecated—recognizing that the JavaScript language had evolved past the patterns request pioneered.',
    finalCommitMessage: 'deprecation: package is fully deprecated, no further updates will be published',
    causeOfDeath: 'Ecological succession. The introduction of async/await, native Promises, and the WHATWG standard fetch API rendered callback-driven architecture obsolete.',
    tags: ['Node.js', 'HTTP', 'Legendary', 'Callbacks', 'Architectural Pioneer'],
    avatarUrl: 'https://avatars.githubusercontent.com/u/1085351?s=200&v=4',
    candlesLit: 1428,
    offeringsCount: 382,
    vintageSnippet: {
      title: 'Vintage Callback Request (2012)',
      language: 'javascript',
      code: `var request = require('request');

request.get({
  url: 'https://api.github.com/repos/request/request',
  headers: { 'User-Agent': 'Node-App-v0.8' },
  json: true
}, function (error, response, body) {
  if (error) {
    console.error('Request failed:', error);
    return;
  }
  if (response.statusCode === 200) {
    console.log('Repo stars:', body.stargazers_count);
    // Nested callback hell for secondary call
    request.get({
      url: body.subscribers_url,
      headers: { 'User-Agent': 'Node-App-v0.8' },
      json: true
    }, function (subErr, subRes, subBody) {
      if (subErr) return console.error(subErr);
      console.log('Subscribers:', subBody.length);
    });
  }
});`
    },
    modernResurrection: {
      title: 'Resurrected 2026: TypeScript & Native Fetch',
      language: 'typescript',
      code: `interface RepoInfo {
  stargazers_count: number;
  subscribers_url: string;
}

async function fetchRepoDetails(repoPath: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(\`https://api.github.com/repos/\${repoPath}\`, {
      headers: { 'User-Agent': 'Modern-App-2026' },
      signal: controller.signal
    });

    if (!res.ok) throw new Error(\`HTTP Error: \${res.status}\`);
    const data = (await res.json()) as RepoInfo;
    console.log(\`Repo stars: \${data.stargazers_count}\`);

    // Clean, unnested async flow
    const subRes = await fetch(data.subscribers_url, {
      headers: { 'User-Agent': 'Modern-App-2026' }
    });
    const subscribers = await subRes.json();
    console.log(\`Subscribers: \${subscribers.length}\`);
  } finally {
    clearTimeout(timeoutId);
  }
}` ,
      explanation: 'Replaced callback hell with async/await, native global fetch (zero external dependencies), AbortController for deterministic timeouts, and TypeScript interfaces for full compile-time safety.'
    }
  },
  {
    id: 'moment',
    name: 'moment.js',
    fullName: 'moment/moment',
    yearsActive: '2011 – 2020',
    birthYear: 2011,
    deathYear: 2020,
    starsAtSunset: 47200,
    peakWeeklyDownloads: '32,000,000',
    category: 'JavaScript',
    authorOrMaintainer: 'Tim Wood & Iskren Chernev',
    epitaph: 'Parse, validate, manipulate, and display dates in JavaScript. The sanctuary for every developer who lost their sanity to JavaScript Date.',
    obituary: 'Before moment.js, formatting a timestamp in JavaScript was an exercise in torment. Moment saved countless engineering years. However, its mutable object model and lack of tree-shaking led the maintainers in September 2020 to declare it in maintenance mode, encouraging developers to migrate toward modern immutable temporal libraries.',
    finalCommitMessage: 'Project Status: We now consider Moment to be a legacy project in maintenance mode.',
    causeOfDeath: 'Mutability traps and bundle size (300KB without tree-shaking). Modern JS temporal APIs and immutable alternatives (date-fns, Luxon, Dayjs) took over.',
    tags: ['Dates', 'Timestamps', 'Client-side', 'Iconic', 'Maintenance Mode'],
    avatarUrl: 'https://avatars.githubusercontent.com/u/1424444?s=200&v=4',
    candlesLit: 2154,
    offeringsCount: 529,
    vintageSnippet: {
      title: 'Mutable Date Manipulation (2013)',
      language: 'javascript',
      code: `var moment = require('moment');

var now = moment();
var nextWeek = now.add(7, 'days'); // WARNING: 'now' is now also mutated!

console.log('Today:', now.format('YYYY-MM-DD'));
console.log('Next Week:', nextWeek.format('YYYY-MM-DD'));
// Both prints will show the same date due to in-place mutation!`
    },
    modernResurrection: {
      title: 'Resurrected 2026: Immutable Native Intl & Temporal',
      language: 'typescript',
      code: `// Using modern JavaScript native Intl and immutable Date arithmetic
function formatRelativeDate(baseDate: Date = new Date(), daysAhead: number = 7): {
  original: string;
  future: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC'
  });

  // Pure immutable arithmetic
  const futureDate = new Date(baseDate.getTime() + daysAhead * 86_400_000);

  return {
    original: formatter.format(baseDate),
    future: formatter.format(futureDate)
  };
}

const { original, future } = formatRelativeDate();
console.log({ original, future });` ,
      explanation: 'Transmuted mutable object state into pure immutable functions using native Intl.DateTimeFormat, requiring 0 kB added bundle size and preventing accidental side-effects.'
    }
  },
  {
    id: 'urllib2',
    name: 'urllib2 (Python 2)',
    fullName: 'python/cpython/Lib/urllib2.py',
    yearsActive: '2001 – 2020',
    birthYear: 2001,
    deathYear: 2020,
    starsAtSunset: 55000,
    peakWeeklyDownloads: 'Uncounted Millions (Standard Library)',
    category: 'Python',
    authorOrMaintainer: 'Python Software Foundation & Jeremy Hylton',
    epitaph: 'The venerable networking workhorse of Python 2.x. Taught an entire generation how to craft HTTP requests, basic auth, and cookie jars.',
    obituary: 'For nineteen glorious years, urllib2 was the default way developers made HTTP requests in Python. It weathered the transition from early CGI scripts to modern web services. When Python 2 reached official End-of-Life on January 1, 2020, urllib2 was gracefully split and laid to rest in urllib.request and urllib.error.',
    finalCommitMessage: 'PEP 3108: Reorganized standard library for Python 3',
    causeOfDeath: 'Python 2 Sunset. Replaced by urllib.request, Requests (HTTP for Humans), and modern async httpx.',
    tags: ['Python 2', 'Stdlib', 'Venerable', 'EOL', 'Networking'],
    avatarUrl: 'https://avatars.githubusercontent.com/u/1525981?s=200&v=4',
    candlesLit: 1890,
    offeringsCount: 412,
    vintageSnippet: {
      title: 'Vintage Python 2.7 urllib2 script',
      language: 'python',
      code: `import urllib2
import json

url = "https://api.github.com/zen"
req = urllib2.Request(url, headers={'User-Agent': 'Python2-Scraper/2.7'})

try:
    response = urllib2.urlopen(req, timeout=10)
    html = response.read() # returns raw str (bytes) in Python 2
    print "The Zen of GitHub: %s" % html
except urllib2.HTTPError, e:
    print "HTTP Error:", e.code
except urllib2.URLError, e:
    print "Connection failed:", e.reason`
    },
    modernResurrection: {
      title: 'Resurrected 2026: Python 3.12 Type-Safe Httpx',
      language: 'python',
      code: `import asyncio
import httpx
from typing import Final

ZEN_URL: Final[str] = "https://api.github.com/zen"

async def fetch_zen() -> str:
    headers = {"User-Agent": "ModernPython-3.12"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(ZEN_URL, headers=headers)
            response.raise_for_status()
            # Explicit utf-8 text decoding, f-strings, type annotations
            return f"The Zen of GitHub: {response.text.strip()}"
        except httpx.HTTPStatusError as exc:
            return f"HTTP error {exc.response.status_code} encountered."
        except httpx.RequestError as exc:
            return f"Network transport error: {exc}"

if __name__ == "__main__":
    message = asyncio.run(fetch_zen())
    print(message)` ,
      explanation: 'Replaced legacy urllib2 with modern asynchronous HTTP client (httpx), async/await context managers, modern f-string syntax, and strict typing.'
    }
  },
  {
    id: 'bower',
    name: 'bower',
    fullName: 'bower/bower',
    yearsActive: '2012 – 2017',
    birthYear: 2012,
    deathYear: 2017,
    starsAtSunset: 15300,
    peakWeeklyDownloads: '12,000,000',
    category: 'Build Tools',
    authorOrMaintainer: 'Twitter & Open Source Community',
    epitaph: 'A package manager for the web. Introduced flat dependency trees to front-end development when npm was strictly nested.',
    obituary: 'Created by engineers at Twitter in 2012, Bower recognized that browsers could not tolerate duplicate nested dependencies. It taught front-end engineers the power of package management. By 2017, with Yarn and npm v3 introducing flat node_modules and Webpack managing client bundles, Bower graciously asked developers to migrate to modern tools.',
    finalCommitMessage: 'Update README: ...psst! While Bower is maintained, we recommend using Yarn and Webpack for front-end projects.',
    causeOfDeath: 'Mission Accomplished. npm adopted flat dependency resolution, and module bundlers made a separate front-end package manager redundant.',
    tags: ['Front-end', 'Twitter', 'Package Manager', 'Flat Dependencies'],
    avatarUrl: 'https://avatars.githubusercontent.com/u/3284617?s=200&v=4',
    candlesLit: 984,
    offeringsCount: 198,
    vintageSnippet: {
      title: 'Vintage bower.json & Flat Resolution (2014)',
      language: 'json',
      code: `{
  "name": "vintage-webapp",
  "version": "1.0.0",
  "dependencies": {
    "jquery": "~2.1.4",
    "bootstrap": "~3.3.5",
    "font-awesome": "~4.4.0"
  },
  "resolutions": {
    "jquery": "~2.1.4"
  }
}`
    },
    modernResurrection: {
      title: 'Resurrected 2026: Modern ESM & Subpath Imports',
      language: 'json',
      code: `{
  "name": "modern-webapp-2026",
  "version": "1.0.0",
  "type": "module",
  "packageManager": "pnpm@9.0.0",
  "dependencies": {
    "lucide-react": "^1.16.0",
    "tailwindcss": "^3.4.17"
  },
  "exports": {
    ".": "./src/index.js",
    "./components/*": "./src/components/*.js"
  }
}` ,
      explanation: 'Modern package ecosystem with native ESM module declarations, strict packageManager declarations, and native subpath exports without needing a separate frontend package repository.'
    }
  },
  {
    id: 'coffeescript',
    name: 'CoffeeScript',
    fullName: 'jashkenas/coffeescript',
    yearsActive: '2009 – 2018',
    birthYear: 2009,
    deathYear: 2018,
    starsAtSunset: 16100,
    peakWeeklyDownloads: '6,500,000',
    category: 'Frameworks',
    authorOrMaintainer: 'Jeremy Ashkenas',
    epitaph: 'Unpretentious JavaScript. It gave us the future of JavaScript seven years before the TC39 committee could deliver ES2015.',
    obituary: 'CoffeeScript was an act of radical poetry: it proved that JavaScript could be succinct, beautiful, and expressive without curly braces and semicolons. It gave us arrow functions, classes, destructuring, and existential operators. In doing so, it inspired ES6/ES2015 directly—a programming language whose greatest triumph was that its ideas were absorbed into the mother tongue.',
    finalCommitMessage: 'CoffeeScript 2 compiles to modern JavaScript (ES6+)',
    causeOfDeath: 'Self-Transcendence. The ECMAScript standard adopted CoffeeScripts finest ideas directly into native JavaScript.',
    tags: ['Transpiler', 'Syntactic Sugar', 'ES6 Precursor', 'Poetic'],
    avatarUrl: 'https://avatars.githubusercontent.com/u/101423?s=200&v=4',
    candlesLit: 3120,
    offeringsCount: 780,
    vintageSnippet: {
      title: 'Vintage CoffeeScript (2011)',
      language: 'coffeescript',
      code: `# Square numbers with concise arrow function
square = (x) -> x * x

# Class with constructor & default parameters
class Sorcerer
  constructor: (@name = "Merlin", @mana = 100) ->

  castSpell: (spell) ->
    console.log "#{@name} casts #{spell}!" if @mana > 10

# Existential operator and array comprehension
spells = ("Fireball" for spell in grimoire? when spell.ready)`
    },
    modernResurrection: {
      title: 'Resurrected 2026: Native TypeScript with Optional Chaining',
      language: 'typescript',
      code: `// Modern TypeScript 2026 inherits all of CoffeeScript's dreams natively
const square = (x: number): number => x * x;

class Sorcerer {
  constructor(
    public readonly name: string = "Merlin",
    public mana: number = 100
  ) {}

  castSpell(spell: string): void {
    if (this.mana > 10) {
      console.log(\`\${this.name} casts \${spell}!\`);
    }
  }
}

// Native optional chaining and nullish coalescing
const spells = grimoire?.filter((s) => s.ready).map((s) => s.name) ?? [];` ,
      explanation: 'Modern JavaScript and TypeScript now natively provide arrow functions, template literals, class parameter properties, and optional chaining—making CoffeeScript immortal in the language itself.'
    }
  },
  {
    id: 'enzyme',
    name: 'Enzyme',
    fullName: 'enzymejs/enzyme',
    yearsActive: '2015 – 2021',
    birthYear: 2015,
    deathYear: 2021,
    starsAtSunset: 20100,
    peakWeeklyDownloads: '2,500,000',
    category: 'Frameworks',
    authorOrMaintainer: 'AirBnB & Jordan Harband',
    epitaph: 'JavaScript Testing utilities for React. Taught the world how to assert props, state, and shallow trees.',
    obituary: 'Enzyme was the gold standard for testing React components for half a decade. When React 16 introduced Hooks, Fiber, and Concurrent rendering, shallow rendering could no longer represent the reality of user interactions. The testing philosophy pivoted to testing user behavior over implementation details, and Enzyme was retired.',
    finalCommitMessage: 'No React 18 support will be developed. Please migrate to React Testing Library.',
    causeOfDeath: 'Shift in Testing Philosophy. Shallow component inspection broke under React Hooks and Concurrent Mode, ceding the throne to React Testing Library.',
    tags: ['React', 'Testing', 'AirBnB', 'Shallow Rendering'],
    avatarUrl: 'https://avatars.githubusercontent.com/u/16147496?s=200&v=4',
    candlesLit: 875,
    offeringsCount: 164,
    vintageSnippet: {
      title: 'Enzyme Shallow State Inspection (2017)',
      language: 'javascript',
      code: `import { shallow } from 'enzyme';
import Counter from './Counter';

describe('<Counter />', () => {
  it('increments internal state counter', () => {
    const wrapper = shallow(<Counter />);
    expect(wrapper.state('count')).toBe(0); // White-box state testing
    wrapper.find('button.increment').simulate('click');
    expect(wrapper.state('count')).toBe(1);
  });
});`
    },
    modernResurrection: {
      title: 'Resurrected 2026: React Testing Library & Accessibility Queries',
      language: 'typescript',
      code: `import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

describe('<Counter />', () => {
  it('increments count accessible to the user', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    // Black-box testing via accessible roles and labels
    expect(screen.getByRole('status')).toHaveTextContent('Count: 0');
    
    await user.click(screen.getByRole('button', { name: /increment/i }));
    
    expect(screen.getByRole('status')).toHaveTextContent('Count: 1');
  });
});` ,
      explanation: 'Shifted from testing internal state properties (which breaks upon refactor) to black-box accessible DOM interaction using modern userEvent and accessibility queries.'
    }
  }
];
