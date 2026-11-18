// English version of the game content. Keys match the ids in src/game/content.js.
// Only text lives here: numbers and effects stay in content.js.
export const CONTENT_EN = {
  items: {
    panel: { name: 'Extra solar panel', desc: '+1 panel: more energy every sol.' },
    battery: { name: 'Battery', desc: 'Stores up to 4 ⚡ of leftover energy for the next sol.' },
    moxie: { name: 'MOXIE generator', desc: 'Makes oxygen from Mars air (CO₂). Each ⚡ in Life support gives 50% more.', fact: 'MOXIE is real: it flew on the Perseverance rover and made oxygen on Mars.' },
    rations: { name: 'Food rations', desc: '+30 food when you land.' },
    o2tank: { name: 'Oxygen tank', desc: '+30 oxygen when you land.' },
    seeds: { name: 'Potato seedlings', desc: 'Already sprouted plants for the hydroponic greenhouse. No seedlings, no new food!' },
    water: { name: 'Water tanks', desc: 'Water blocks radiation: your shield blocks 30% more.', fact: 'Materials rich in hydrogen, like water, are good radiation shields.' },
    repair: { name: 'Repair kit', desc: 'Fixes one breakdown without using energy.' },
    medkit: { name: 'Medical kit', desc: 'Heals the crew once.' },
    science: { name: 'Science instruments', desc: 'Each ⚡ in Science gives double points.' },
  },
  systems: {
    life: { name: 'Life support', help: 'Makes oxygen to breathe. With little ⚡ the air goes down: check the paper.' },
    greenhouse: { name: 'Greenhouse', help: 'Hydroponics: seedlings grow with light and water, no soil. Each ⚡ makes food.' },
    shield: { name: 'Shield', help: 'Protects from radiation. Each ⚡ blocks 30%.' },
    science: { name: 'Science', help: 'Experiments. That is why we came to Mars!' },
  },
  glossary: {
    sol: 'A "sol" is a day on Mars. It lasts 24 hours and 39 minutes, a little longer than a day on Earth.',
    cme: 'Coronal mass ejection (CME): a giant cloud of particles thrown by the Sun. If it reaches Mars, radiation goes up.',
    radiacion: 'Radiation: invisible energy from space. Too much harms the body. Mars has no global magnetic field like Earth, so more of it reaches the ground.',
    msv: 'mSv (millisievert): the unit used to measure how much radiation a person receives.',
    donki: 'DONKI is the NASA database that records real solar storms.',
    eva: 'EVA: "extravehicular activity", which means going outside in a spacesuit.',
    delay: 'Communication delay: radio messages travel at the speed of light, but Mars is so far away that they take several minutes to arrive.',
    sep: 'SEP: solar energetic particles. They are the most dangerous ones because they arrive very fast and go through almost anything.',
  },
  storms: {
    1: { title: 'Weak solar storm' },
    2: { title: 'Strong solar storm' },
    3: { title: 'EXTREME solar storm!' },
  },
  builds: {
    panel: { name: 'New solar panel', gain: '+2 ⚡ every sol', fact: 'On Mars, sunlight is less than half as strong as on Earth: that is why a base needs many panels.' },
    shelter: { name: 'Regolith shelter', gain: '🛡️ always blocks 30%', fact: 'Regolith is the dust and rocks of the Martian ground. Covering the base with regolith blocks radiation without using energy.' },
    farm: { name: 'Big greenhouse', gain: 'each ⚡ gives +3 🥔 more', fact: 'Lettuce, radishes and chili peppers have already been grown on the Space Station. On Mars we will need to grow much more.' },
    lab: { name: 'Weather station', gain: '+1 🔬 by itself, every sol', fact: 'The Perseverance rover carries a weather station (MEDA) that measures the wind, temperature and dust of Mars.' },
  },
  missions: {
    shield: 'Block almost all of the storm (85% or more)',
    fix: 'Fix something broken at the base today',
    air: 'End the sol with 10 more air',
    food: 'End the sol with 5 more food',
    science: 'Earn 3 science points today',
    save: 'Save ⚡ for tomorrow (2 if you have a battery)',
    build: 'Put 2 ⚡ into the build',
  },
  repairs: {
    leak: { label: 'Patch the leak' },
    panel: { label: 'Fix the panel' },
  },
  events: {
    leak: {
      title: 'A meteorite punctured the dome!',
      text: 'A tiny space rock made a hole. Air is escaping!',
      fact: 'Space rocks travel so fast that even one the size of a grain of sand can punch through a wall.',
      choices: [
        { label: 'Use the repair kit', outcome: '🧰 ✅ Hole sealed!' },
        { label: 'Patch it with what we have', outcome: '🩹 Patched. It cost energy.' },
        { label: 'Ignore it for now', hint: '−10 🫁 · the leak stays', outcome: '💨 The leak continues: −5 🫁 every sol until you fix it.' },
      ],
    },
    dust: {
      title: 'Dust storm',
      text: 'Dust covers the sky and dirties the solar panels.',
      fact: 'In 2018 a dust storm covered all of Mars and the Opportunity rover ran out of power forever.',
      choices: [
        { label: 'Go out and clean the panels', hint: '−8 🫁 · more ⚡', outcome: '🧹✨ Clean panels. You used air, but you get more energy.' },
        { label: 'Stay inside', hint: 'Less ⚡ for 3 sols', outcome: '🟫 The panels stay dirty: less ⚡ for 3 sols.' },
      ],
    },
    ice: {
      title: 'The rover found ice!',
      text: 'There is water ice under the sand. With electricity you can get oxygen from it.',
      fact: 'There is a lot of water ice buried on Mars. It is key for future bases.',
      choices: [
        { label: 'Build an ice mine', hint: '−2 ⚡ today · +5 🫁 every sol', outcome: '⛏️🧊 Ice mine ready! +5 🫁 every sol.' },
        { label: 'Just study it', outcome: '🔬 Data sent to Earth (+3 science).' },
      ],
    },
    blight: {
      title: 'Sick plants',
      text: 'The potatoes are turning yellow. There is a fungus in the greenhouse.',
      fact: 'Growing food in space is hard: plants also suffer with little light and low gravity.',
      choices: [
        { label: 'Remove the sick plants', outcome: '🥀➡️🌱 Fewer plants, but the rest are healthy.' },
        { label: 'Disinfect with UV light', outcome: '💜 The UV light killed the fungus.' },
      ],
    },
    sick: {
      title: 'Someone feels sick',
      text: 'Fever and tiredness. In space the immune system works differently.',
      fact: 'NASA studies (OSDR repository) show that spaceflight changes the immune system.',
      choices: [
        { label: 'Use the medical kit', outcome: '⛑️💚 Recovered!' },
        { label: 'Rest today', hint: 'No 🔬 today', outcome: '😴 They rested. No science today.' },
        { label: 'Keep working', outcome: '🤒⬇️ It got worse. Crew health went down.' },
      ],
    },
    bones: {
      title: 'Weaker bones',
      text: 'Gravity on Mars is only 38% of Earth’s. Bones and muscles get weaker.',
      fact: 'In space, astronauts can lose about 1% of their bone mass per month. That is why they exercise every day.',
      choices: [
        { label: 'Exercise on the bike', outcome: '🚴💪 Strong bones!' },
        { label: 'Skip the exercise', outcome: '🦴⬇️ The body feels it.' },
      ],
    },
    message: {
      title: 'Computer failure',
      text: 'The computer shows a strange error. Should we ask Earth?',
      choices: [
        { label: 'Wait for Earth', hint: '−1 ⚡ (time)', outcome: '📡✅ The answer arrived. Fixed!' },
        { label: 'Solve it ourselves', outcome: { success: '🧠✅ You solved it alone! +2 🔬', fail: '⚠️ The fix switched off life support for a while (−12 🫁).' } },
      ],
    },
    panelbreak: {
      title: 'A solar panel broke',
      text: 'A gust of sand hit a panel and it stopped working.',
      choices: [
        { label: 'Use the repair kit', outcome: '🧰⚡ Panel as good as new.' },
        { label: 'Fix it outside (EVA)', outcome: '👩‍🚀⚡ Fixed while wearing the suit.' },
        { label: 'Leave it broken', hint: '−2 ⚡ every sol', outcome: '💥 Broken panel: less ⚡ every sol. You can fix it later.' },
      ],
    },
    rock: {
      title: 'A very strange rock',
      text: 'A layered rock, as if it had been underwater millions of years ago.',
      fact: 'Curiosity and Perseverance found rocks that formed in lakes and rivers on Mars billions of years ago.',
      choices: [
        { label: 'Go get it (EVA)', outcome: '🪨📦 Sample stored at the base!' },
        { label: 'Take pictures', outcome: '📸 Better than nothing.' },
      ],
    },
    expedition: {
      title: 'Quiet day: shall we explore?',
      text: 'No solar storm today, so we can go out. Exploring uses air and can go wrong. Where do we send the rover?',
      choices: [
        {
          label: '🧊 To the icy crater', hint: 'near · 80%',
          outcome: { success: '🧊 They brought ice! Melted, it gives water and air: +14 🫁', fail: 'The ice was too deep. Air was used up: −6 🫁' },
          fact: 'Mars has water ice under the ground and at the poles. Water can be turned into oxygen to breathe and fuel to fly home.',
        },
        {
          label: '🕳️ To the lava cave', hint: 'medium · 70%',
          outcome: { success: '🕳️ A huge cave! +3 science (−6 🫁)', fail: 'The rover got stuck at the entrance. −6 🫁 and −6 ❤️ from the effort' },
          fact: 'Lava tubes are caves left by the volcanoes of Mars. Inside, the rock blocks radiation: they could be homes for astronauts.',
        },
        {
          label: '🤖 To the old rover', hint: 'far · 65%',
          outcome: { success: '🔋 Its batteries still work! +3 ⚡ tomorrow (−8 🫁)', fail: 'It was buried in dust and nothing could be saved. −8 🫁' },
          fact: 'The Opportunity rover was built to work for 90 days and kept going for more than 14 years on Mars.',
        },
        {
          label: '⛰️ To the lookout hill', hint: 'near · safe',
          outcome: '📸 What a view! Photos and measurements: +2 science (−5 🫁)',
          fact: 'Mars has Olympus Mons, the tallest volcano in the solar system: about two and a half times Mount Everest.',
        },
        { label: '🏠 Stay at the base', hint: 'no risk', outcome: '😴 The crew rested: +4 ❤️' },
      ],
    },
    help_water: {
      title: 'The botanist needs help',
      text: 'The hydroponic greenhouse watering got out of balance.',
      ask: 'Commander! Can you help me with the watering?',
      talk: 'Each tray needs just the right amount of water: up to the green band. Too much and it overflows and the roots drown. Can you give me a hand?',
      fact: 'In hydroponics plants grow without soil: the roots take water and nutrients from a liquid. It saves water, which is very precious on Mars.',
      choices: [
        { label: 'Sure, I\'ll help!', outcome: '💧🌱 Watering fixed!' },
        { label: 'Not now', outcome: '🌱 She fixed it alone, more slowly (+2 🥔).' },
      ],
    },
    help_antenna: {
      title: 'The engineer needs help',
      text: 'The antenna lost the signal with Earth.',
      ask: 'Commander! We lost the signal with Earth',
      talk: 'We need to aim the antenna again. Turn it slowly until the signal reaches the top and stay there. Will you help me?',
      fact: 'NASA talks to its spacecraft with the Deep Space Network: giant antennas in California, Spain and Australia. As Earth turns, one of them is always facing Mars.',
      choices: [
        { label: 'Sure, I\'ll help!', outcome: '📡✅ Signal with Earth!' },
        { label: 'Not now', outcome: '📡 The engineer aimed it alone; it took all afternoon (+1 🔬).' },
      ],
    },
    help_build: {
      title: 'The engineer needs help',
      text: 'The construction needs another pair of hands.',
      ask: 'Commander! Can you give me a hand with the build?',
      talk: 'Today we can move the build forward without spending energy. The pieces go in order, from the bottom up: look at the plan and pick the one for each level.',
      fact: 'NASA engineers study how to build on Mars with robots and 3D printers that use Martian soil itself (regolith), so not everything has to come from Earth.',
      choices: [
        { label: 'Sure, I\'ll help!', outcome: '🏗️ Teamwork!' },
        { label: 'Not now', outcome: '🏗️ The build stays as it was.' },
      ],
    },
    supply: {
      title: 'A capsule from Earth has arrived!',
      text: 'Halfway through the mission: Earth sent cargo. The rover can only bring ONE crate before night. Which one?',
      fact: 'Cargo for Mars is sent long in advance: launches are only possible every 26 months, when Earth and Mars are close.',
      choices: [
        { label: 'The oxygen crate', outcome: '🧪 Fresh air for the base! +20 🫁' },
        { label: 'The food crate', outcome: '🥫 Food from home! +20 🥔' },
        { label: 'The instruments crate', outcome: '🔬 New instruments! +3 science' },
      ],
    },
    sunset: {
      title: 'Blue sunset',
      text: 'On Mars the sunset is blue! Everyone goes out to watch.',
      fact: 'Martian dust scatters blue light forward: at sunset the sky around the Sun looks blue.',
      choices: [{ label: 'So pretty!', outcome: '🌅💙 The crew is happy.' }],
    },
  },
}
