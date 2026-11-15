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
