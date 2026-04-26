type Category =
  | 'produce' | 'dairy' | 'meat' | 'frozen'
  | 'bakery' | 'pantry' | 'drinks' | 'snacks' | 'hygiene';

const KEYWORDS: Record<Category, string[]> = {
  produce: [
    // Swedish
    'äpple', 'päron', 'banan', 'apelsin', 'mandarin', 'citron', 'lime', 'mango',
    'ananas', 'melon', 'vattenmelon', 'druva', 'jordgubbe', 'hallon', 'blåbär',
    'björnbär', 'körsbär', 'plommon', 'persika', 'aprikos', 'kiwi', 'avokado',
    'tomat', 'gurka', 'sallad', 'rucola', 'spenat', 'kål', 'broccoli', 'blomkål',
    'morot', 'rödbeta', 'potatis', 'sötpotatis', 'lök', 'rödlök', 'salladslök',
    'vitlök', 'purjolök', 'paprika', 'zucchini', 'aubergine', 'selleri', 'fänkål',
    'majs', 'ärtor', 'bönor', 'squash', 'svamp', 'ingefära', 'chili', 'persilja',
    'basilika', 'mynta', 'koriander', 'dill', 'gräslök', 'timjan', 'rosmarin',
    'frukt', 'grönsak', 'grönt',
    // English
    'apple', 'pear', 'banana', 'orange', 'lemon', 'mango', 'pineapple', 'melon',
    'grape', 'strawberry', 'raspberry', 'blueberry', 'blackberry', 'cherry',
    'plum', 'peach', 'apricot', 'kiwi', 'avocado', 'tomato', 'cucumber',
    'lettuce', 'spinach', 'cabbage', 'broccoli', 'cauliflower', 'carrot',
    'beetroot', 'potato', 'onion', 'garlic', 'pepper', 'zucchini', 'eggplant',
    'celery', 'fennel', 'corn', 'peas', 'mushroom', 'ginger', 'chili',
    'parsley', 'basil', 'mint', 'coriander', 'dill', 'thyme', 'rosemary',
    'fruit', 'vegetable', 'veggie', 'herb',
  ],
  dairy: [
    // Swedish
    'mjölk', 'filmjölk', 'yoghurt', 'yogurt', 'grädde', 'vispgrädde', 'crème fraîche',
    'creme fraiche', 'smör', 'ost', 'fetaost', 'mozzarella', 'cheddar', 'brie',
    'camembert', 'parmesan', 'kvarg', 'kesella', 'ricotta', 'ägg', 'margarin',
    'laktosfri', 'havredryck', 'sojamjölk', 'mandelmjölk',
    // English
    'milk', 'cream', 'butter', 'cheese', 'feta', 'cheddar', 'parmesan', 'brie',
    'mozzarella', 'ricotta', 'yoghurt', 'yogurt', 'quark', 'eggs', 'egg',
    'margarine', 'oat milk', 'soy milk', 'almond milk', 'dairy',
  ],
  meat: [
    // Swedish
    'kyckling', 'kycklingfilé', 'kycklinglår', 'nöt', 'nötfärs', 'biff', 'oxfilé',
    'fläsk', 'fläskfilé', 'fläskkarré', 'lamm', 'lammkotlett', 'kalv', 'vilt',
    'korv', 'falukorv', 'grillkorv', 'chorizo', 'salami', 'bacon', 'pancetta',
    'skinka', 'rökt skinka', 'prosciutto', 'lax', 'laxfilé', 'torsk', 'sej',
    'räkor', 'räka', 'kräftor', 'hummer', 'tonfisk', 'sardiner', 'makrill',
    'fisk', 'fiskfilé', 'sill', 'strömming', 'blåmussla', 'bläckfisk',
    'köttbullar', 'köttfärs', 'chark',
    // English
    'chicken', 'beef', 'pork', 'lamb', 'veal', 'turkey', 'duck',
    'sausage', 'bacon', 'ham', 'salami', 'chorizo', 'prosciutto',
    'salmon', 'tuna', 'cod', 'shrimp', 'prawn', 'crab', 'lobster',
    'fish', 'fillet', 'meatball', 'mince', 'steak', 'seafood',
  ],
  frozen: [
    // Swedish
    'fryst', 'frysvaror', 'frysta', 'glass', 'glassen', 'sorbet', 'fryspizza',
    'frysta grönsaker', 'fryst kyckling', 'fryst fisk', 'wienerbröd fryst',
    // English
    'frozen', 'ice cream', 'sorbet', 'gelato', 'popsicle',
  ],
  bakery: [
    // Swedish
    'bröd', 'limpa', 'baguette', 'ciabatta', 'surdegsbröd', 'fralla', 'frallor',
    'bagel', 'croissant', 'bulle', 'kanelbulle', 'wienerbröd', 'muffin', 'kaka',
    'tårta', 'paj', 'knäckebröd', 'riskaka', 'tortilla', 'pitabröd',
    // English
    'bread', 'loaf', 'baguette', 'ciabatta', 'sourdough', 'roll', 'bun',
    'bagel', 'croissant', 'muffin', 'cake', 'pie', 'cracker', 'crispbread',
    'tortilla', 'pita', 'naan', 'wrap', 'pastry',
  ],
  pantry: [
    // Swedish
    'pasta', 'spagetti', 'penne', 'rigatoni', 'ris', 'basmatiris', 'jasminris',
    'mjöl', 'vetemjöl', 'socker', 'florsocker', 'salt', 'peppar', 'olja',
    'olivolja', 'rapsolja', 'vinäger', 'balsamvinäger', 'sojasås', 'ketchup',
    'senap', 'majonnäs', 'honung', 'sylt', 'marmelad', 'jordnötssmör',
    'konserver', 'konserverad', 'tomatpuré', 'tomatsås', 'passata',
    'buljong', 'buljongtärning', 'krydda', 'kryddor', 'oregano', 'curry',
    'paprikapulver', 'spiskummin', 'kanel', 'vanilj', 'bakpulver', 'jäst',
    'nudlar', 'glasnudlar', 'linser', 'kikärtor', 'vita bönor', 'svarta bönor',
    'kokosmjölk', 'kokosnötsmjölk', 'müsli', 'havregryn', 'cornflakes',
    'quinoa', 'bulgur', 'couscous',
    // English
    'pasta', 'spaghetti', 'rice', 'flour', 'sugar', 'salt', 'pepper', 'oil',
    'olive oil', 'vinegar', 'soy sauce', 'ketchup', 'mustard', 'mayonnaise',
    'honey', 'jam', 'marmalade', 'peanut butter', 'canned', 'tomato paste',
    'tomato sauce', 'stock', 'broth', 'spice', 'oregano', 'curry', 'cinnamon',
    'vanilla', 'baking powder', 'yeast', 'noodles', 'lentils', 'chickpeas',
    'beans', 'coconut milk', 'oats', 'muesli', 'granola', 'cereal',
    'quinoa', 'bulgur', 'couscous',
  ],
  drinks: [
    // Swedish
    'vatten', 'mineralvatten', 'läsk', 'cola', 'fanta', 'sprite', 'juice',
    'apelsinjuice', 'äppeljuice', 'nektar', 'saft', 'öl', 'lager', 'ipa',
    'cider', 'vin', 'rödvin', 'vitvin', 'rosé', 'champagne', 'prosecco',
    'whisky', 'vodka', 'gin', 'rom', 'likör', 'kaffe', 'kaffekapslar',
    'espresso', 'te', 'örtte', 'kakao', 'varm choklad', 'energidryck',
    'sportdryck', 'kombuchacha', 'kombucha',
    // English
    'water', 'sparkling water', 'soda', 'cola', 'juice', 'lemonade', 'squash',
    'beer', 'ale', 'lager', 'cider', 'wine', 'champagne', 'prosecco',
    'whisky', 'whiskey', 'vodka', 'gin', 'rum', 'coffee', 'espresso',
    'tea', 'cocoa', 'hot chocolate', 'energy drink', 'kombucha',
  ],
  snacks: [
    // Swedish
    'chips', 'popcorn', 'godis', 'choklad', 'kola', 'lakrits', 'skumgodis',
    'vingummi', 'nötter', 'cashewnötter', 'mandel', 'valnötter', 'hasselnötter',
    'jordnötter', 'pistaschnötter', 'kex', 'saltkex', 'digestive', 'bars',
    'müslibar', 'proteinbar', 'strössel', 'marshmallow',
    // English
    'chips', 'crisps', 'popcorn', 'candy', 'chocolate', 'caramel', 'liquorice',
    'gummies', 'nuts', 'cashews', 'almonds', 'walnuts', 'peanuts', 'pistachios',
    'crackers', 'biscuits', 'cookies', 'bars', 'granola bar', 'protein bar',
    'marshmallow', 'pretzels',
  ],
  hygiene: [
    // Swedish
    'tvål', 'flytande tvål', 'handtvål', 'schampo', 'balsam', 'hårinpackning',
    'tandkräm', 'tandborste', 'tandtråd', 'munskölj', 'deodorant', 'rakgel',
    'rakhyvel', 'ansiktskräm', 'fuktkräm', 'solkräm', 'smink', 'mascara',
    'läppstift', 'toalettpapper', 'hushållspapper', 'servetter', 'våtservetter',
    'diskmedel', 'diskmaskinspulver', 'tvättmedel', 'sköljmedel', 'rengöring',
    'allrengöring', 'badrumsrengöring', 'wc-rengöring', 'fönsterputs',
    'plastpåsar', 'soppåsar', 'aluminiumfolie', 'plastfolie', 'bakplåtspapper',
    'svamp', 'disksvamp', 'skursvamp', 'moppar', 'dammsugarpåsar',
    // English
    'soap', 'shampoo', 'conditioner', 'toothpaste', 'toothbrush', 'dental floss',
    'mouthwash', 'deodorant', 'razor', 'moisturiser', 'moisturizer', 'sunscreen',
    'makeup', 'mascara', 'lipstick', 'toilet paper', 'paper towels', 'napkins',
    'wipes', 'dish soap', 'dishwasher', 'laundry', 'detergent', 'fabric softener',
    'cleaner', 'cleaning', 'bleach', 'bin bags', 'trash bags', 'aluminum foil',
    'cling film', 'baking paper', 'sponge',
  ],
};

const KEYWORD_MAP = new Map<string, Category>();
for (const [cat, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
  for (const word of words) {
    KEYWORD_MAP.set(word.toLowerCase(), cat);
  }
}

export function categorizeItem(name: string): string | null {
  const lower = name.toLowerCase().trim();

  // Exact match first
  if (KEYWORD_MAP.has(lower)) return KEYWORD_MAP.get(lower)!;

  // Check if any keyword appears as a word within the name
  for (const [keyword, cat] of KEYWORD_MAP) {
    if (lower.includes(keyword)) return cat;
  }

  return null;
}
