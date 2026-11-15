import {
  BillCategory,
  BillTwittlyReaction,
  CharacteristicKey,
  NationCharacteristics,
  PolicyBill,
  ReactionMood,
} from '../types/engine';

export const CHARACTERISTIC_META: {
  key: CharacteristicKey;
  label: string;
  shortLabel: string;
  barColor: string;
}[] = [
  {
    key: 'economy',
    label: 'Economy',
    shortLabel: 'ECON',
    barColor: '#22C55E',
  },
  {
    key: 'approval',
    label: 'Public Approval',
    shortLabel: 'APPR',
    barColor: '#FACC15',
  },
  {
    key: 'security',
    label: 'National Security',
    shortLabel: 'SEC',
    barColor: '#38BDF8',
  },
  {
    key: 'diplomacy',
    label: 'Diplomacy',
    shortLabel: 'DIPL',
    barColor: '#A78BFA',
  },
  {
    key: 'media',
    label: 'Media Trust',
    shortLabel: 'MEDIA',
    barColor: '#FB923C',
  },
];

export const REACTION_MOODS: {
  mood: ReactionMood;
  label: string;
  avatarColor: string;
  badgeStyle: string;
}[] = [
  {
    mood: 'HAPPY',
    label: 'Happy',
    avatarColor: '#16A34A',
    badgeStyle: 'bg-[#DCFCE7] text-[#166534] border-[#22C55E]',
  },
  {
    mood: 'HYPED',
    label: 'Hyped',
    avatarColor: '#D97706',
    badgeStyle: 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]',
  },
  {
    mood: 'SHOCKED',
    label: 'Shocked',
    avatarColor: '#2563EB',
    badgeStyle: 'bg-[#DBEAFE] text-[#1E40AF] border-[#60A5FA]',
  },
  {
    mood: 'SKEPTICAL',
    label: 'Skeptical',
    avatarColor: '#7C3AED',
    badgeStyle: 'bg-[#EDE9FE] text-[#5B21B6] border-[#A78BFA]',
  },
  {
    mood: 'ANGRY',
    label: 'Angry',
    avatarColor: '#DC2626',
    badgeStyle: 'bg-[#FEE2E2] text-[#991B1B] border-[#F87171]',
  },
];

export function createDefaultThreeReactions(
  billCode: string,
  billTitle: string
): BillTwittlyReaction[] {
  return [
    {
      id: `rx-1-${billCode.replace(/\W+/g, '')}`,
      author: 'Main Street Daily',
      handle: '@MainStreetUSA',
      mood: 'HYPED',
      content: `Huge move from the Oval Office! ${billCode} (${billTitle}) just got signed into law!`,
    },
    {
      id: `rx-2-${billCode.replace(/\W+/g, '')}`,
      author: 'Beltway Insider',
      handle: '@DC_Watchdog',
      mood: 'SKEPTICAL',
      content: `Everyone in Washington is debating ${billCode}. Wait until we see the real numbers next week.`,
    },
    {
      id: `rx-3-${billCode.replace(/\W+/g, '')}`,
      author: 'Angry Taxpayer',
      handle: '@TaxpayerVoice',
      mood: 'ANGRY',
      content: `Wait, they actually signed ${billTitle}?! My group chat is completely losing it right now!`,
    },
  ];
}

export function ensureBillThreeReactions(bill: PolicyBill): BillTwittlyReaction[] {
  const fallback = createDefaultThreeReactions(bill.code, bill.title);
  const existing = Array.isArray(bill.twittlyReactions) ? bill.twittlyReactions : [];
  return [0, 1, 2].map((idx) => existing[idx] || fallback[idx]);
}

export const DEFAULT_CHARACTERISTICS: NationCharacteristics = {
  economy: 60,
  approval: 60,
  security: 65,
  diplomacy: 80,
  media: 55,
};

export const TAB_COLOR_MAP: Record<string, string> = {
  green: '#16A34A',
  blue: '#2563EB',
  red: '#DC2626',
  orange: '#D97706',
  purple: '#9333EA',
};

const RAW_DEFAULT_BILLS_CSV = `bill_code,bill_title,summary_text,category,tab_color,economy,national_security,public_approval,media_trust,diplomacy
E. O. 101,Liberation Day Tariff Order,Places a minimum 10 percent tariff on imports from more than 180 countries and territories. The White House calls it a declaration of economic independence. Markets drop sharply on the first trading day.,Executive Order,green,-20,3,-8,-5,-18
E. O. 102,Penguin Trade Enforcement Order,"Applies a 10 percent tariff to the Heard and McDonald Islands, a territory with no human population and no commercial port. Officials say the move closes a loophole. The penguins do not respond.",Executive Order,green,-1,0,-4,-8,-3
E. O. 103,Ninety Day Tariff Pause,Suspends the higher reciprocal tariff rates for 90 days for most countries while trade deals are negotiated. China is left out of the pause. Stocks have one of their best days in years.,Executive Order,green,18,0,4,-2,10
E. O. 104,China Tariff Escalation Order,Raises tariffs on Chinese imports into triple digits after Beijing retaliates. Shipping orders are cancelled and toy stores warn about empty shelves before the holidays.,Executive Order,green,-22,4,-6,-3,-20
E. O. 105,Northern and Southern Border Tariff Order,"Imposes tariffs on goods from Canada and Mexico, citing border security and drug trafficking. Car parts that cross the border several times during production are taxed every time.",Executive Order,green,-10,6,-2,-2,-14
E. O. 106,Steel and Aluminum Protection Order,Raises tariffs on imported steel and aluminum to 50 percent on national security grounds. Domestic mills celebrate while canned food makers raise prices.,Executive Order,green,-6,6,2,-1,-8
E. O. 107,Hollywood Tariff Order,Proposes a 100 percent tariff on movies produced outside the United States. Studios ask how a movie filmed in three countries and edited on a laptop is supposed to be measured.,Executive Order,green,-6,0,-3,-6,-6
E. O. 108,Brazil Solidarity Tariff,"Places a 50 percent tariff on Brazilian goods, partly over the prosecution of a former Brazilian president. Coffee prices go up across the country.",Executive Order,green,-3,0,-3,-3,-12
E. O. 109,Section 122 Emergency Tariff,"Imposes a 10 percent global tariff hours after the Supreme Court strikes down the previous tariffs, then raises it to 15 percent the next day. The law behind it only allows the tariff for 150 days.",Executive Order,green,-12,0,-7,-4,-10
E. O. 110,Forced Labor Tariff Order,"Replaces the expired emergency tariffs with new duties on 60 economies, justified by their failure to block goods made with forced labor. The president calls them very standard tariffs.",Executive Order,green,-10,2,-4,-3,-12
P. B. 101,Tariff Dividend Act,"Promises a check of at least 2,000 dollars to every American below a certain income, paid from tariff revenue. Budget analysts estimate the cost at about three times what tariffs bring in each year.",Policy Bill,green,-14,0,14,-2,0
P. B. 102,Unlawful Tariff Refund Act,Requires the government to refund importers who paid tariffs later ruled illegal by the Supreme Court. Accountants across the country cancel their vacations.,Policy Bill,green,10,0,2,2,6
P. B. 103,Trade Framework Ratification Act,Asks Congress to approve a list of trade frameworks announced at press conferences. Most of the frameworks have not been written down yet.,Policy Bill,green,4,0,0,-3,6
E. O. 111,Penny Retirement Order,Ends production of the one cent coin because each penny costs more than a cent to make. Cash registers start rounding to the nearest nickel.,Executive Order,green,3,0,5,2,0
E. O. 112,Presidential Signature Currency Order,"Puts the sitting president's signature on all new paper money, replacing the Treasurer's signature for the first time since 1861. The first 100 dollar bills come off the press in June.",Executive Order,green,0,0,-4,-5,-2
P. B. 104,Commemorative Gold Coin Act,Authorizes a 24 karat gold coin with the president's face for the 250th anniversary. Collectors line up while economists ask who the coin is for.,Policy Bill,green,1,0,-2,-3,0
E. O. 113,Gold Card Residency Order,"Creates a fast track residency card for wealthy foreigners at 1 million dollars plus a 15,000 dollar processing fee. A 5 million dollar Platinum Card adds tax benefits. Officials call the payment a gift.",Executive Order,green,8,-3,-4,-5,2
P. B. 105,Gold Card Revenue Fund,Sends all Gold Card payments into a fund for things positive for the country. The Commerce Secretary predicts the program could raise 1 trillion dollars.,Policy Bill,green,6,0,-2,-4,1
E. O. 114,Federal Reserve Chair Replacement,Nominates a new Federal Reserve chair after months of public pressure to cut interest rates. The outgoing chair decides to stay on the board anyway.,Executive Order,green,8,0,2,-4,-2
P. B. 106,Rate Cut Mandate Act,Requires the central bank to lower interest rates whenever the stock market goes up. Economists point out that this is the opposite of how it usually works.,Policy Bill,green,6,0,2,-4,-1
S. D. 101,Federal Reserve Renovation Probe,Opens a federal investigation into cost overruns on the renovation of the central bank's headquarters. A senator blocks the next Fed nominee until the probe is dropped.,State Directive,green,-6,0,-2,-5,-2
E. O. 115,National Crypto Reserve Order,Creates a strategic reserve of cryptocurrency held by the federal government. Critics ask why the government needs a meme coin strategy.,Executive Order,green,2,-1,-2,-4,0
P. B. 107,Presidential Crypto Disclosure Act,Requires presidents to disclose earnings from cryptocurrency ventures connected to their families. First year earnings are estimated at about 1.2 billion dollars.,Policy Bill,green,0,0,4,6,0
E. O. 116,Social Media Sale Deadline Extension,"Extends the deadline for a popular video app to find an American owner, then extends it again. A deal is eventually announced and teenagers keep scrolling.",Executive Order,green,4,3,6,1,3
E. O. 117,Gulf of America Renaming Order,Renames the Gulf of Mexico to the Gulf of America on all federal maps and documents. A wire service that keeps using the old name loses access to Oval Office events.,Executive Order,blue,0,0,3,-12,-8
P. B. 108,Greenland Purchase Appropriation,Sets aside money to buy Greenland from Denmark. Denmark repeats that Greenland is not for sale and Greenlanders say the same.,Policy Bill,blue,-6,6,-3,-3,-16
E. O. 118,Greenland Pressure Tariff,"Threatens 10 percent tariffs on eight European countries, rising to 25 percent, unless the United States can acquire Greenland. The threat is withdrawn four days later.",Executive Order,blue,-10,2,-6,-4,-22
E. O. 119,Greenland Framework Proclamation,Announces a framework of a future deal on Greenland after a speech in Davos where the island is repeatedly called Iceland. No details are released.,Executive Order,blue,3,3,1,-3,6
P. B. 109,Canada Statehood Resolution,Invites Canada to become the 51st state and refers to its prime minister as governor. Canadians stop buying American bourbon in protest.,Policy Bill,blue,-3,0,1,-4,-20
E. O. 120,Canada Talks Termination Order,Ends trade negotiations with Canada after an Ontario television ad quotes Ronald Reagan criticizing tariffs. An extra 10 percent tariff follows.,Executive Order,blue,-3,0,-2,-4,-10
E. O. 121,Wildfire Smoke Tariff Threat,Threatens tariffs on Canada after wildfire smoke drifts across the border before the World Cup final. The smoke does not respond to economic pressure.,Executive Order,blue,-4,0,-3,-5,-12
P. B. 110,Panama Canal Return Act,Demands that control of the Panama Canal return to the United States. Panama says the canal is staying where it is.,Policy Bill,blue,-2,5,2,-3,-14
E. O. 122,Board of Peace Charter,Creates an international Board of Peace chaired by the president. Permanent seats cost 1 billion dollars and other members serve three year terms.,Executive Order,blue,4,2,-4,-8,-6
E. O. 123,Gaza Peace Summit Agreement,Signs a ceasefire framework with regional leaders in Egypt after a long speech to the Israeli parliament. The president arrives hours late because the speeches before his ran long.,Executive Order,blue,3,8,8,2,18
S. D. 102,Alaska Red Carpet Summit,"Hosts the Russian president in Alaska with a red carpet, a fighter jet flyover and a ride in the presidential limousine. No deal is reached, because there is no deal until there is a deal.",State Directive,blue,0,-2,-3,-2,4
E. O. 124,Beijing Summit Purchase Agreement,Concludes a state visit to China with promises of fantastic trade deals and an order for 200 Boeing jets. Boeing stock falls anyway because investors expected more.,Executive Order,blue,8,0,3,0,10
E. O. 125,Busan Trade Truce,Agrees to a one year pause in the trade war with China after a meeting in South Korea. Farmers get soybean orders back and markets breathe again.,Executive Order,blue,12,0,3,0,12
P. B. 111,NATO Five Percent Act,Requires allies to spend 5 percent of their economy on defense or risk reduced American support. European leaders respond with flattery and large arms orders.,Policy Bill,blue,2,8,3,-1,-8
S. D. 103,Ankara Summit Declaration,Signs the NATO summit declaration in Turkey after arriving in a sour mood. The president leaves saying there was a lot of love in the room.,State Directive,blue,2,8,3,0,12
E. O. 126,Qatar Jet Acceptance Order,"Accepts a 400 million dollar Boeing 747 from Qatar and repaints it navy, red and gold for use as Air Force One. The classic light blue design is retired.",Executive Order,blue,2,-5,-6,-6,6
S. D. 104,FIFA Peace Prize Acceptance,Accepts the first ever FIFA Peace Prize at the World Cup draw. The medal can be worn everywhere and the president puts it on immediately.,State Directive,blue,0,0,1,-4,2
S. D. 105,Nobel Medal Custody Agreement,Accepts a Nobel Peace Prize medal handed over by the actual laureate. The Nobel Institute clarifies that the medal can change owners but the title cannot.,State Directive,blue,0,0,1,-5,-3
E. O. 127,Paris Climate Withdrawal,Pulls the United States out of the Paris climate agreement again. Coal executives cheer and European diplomats sigh.,Executive Order,blue,3,0,-2,-2,-10
E. O. 128,World Health Organization Exit,Withdraws the United States from the World Health Organization and stops its funding. Health officials in other countries rearrange their budgets.,Executive Order,blue,1,-3,-3,-2,-10
S. D. 106,Ukraine Suit Diplomacy Protocol,Asks visiting leaders to wear a formal suit to Oval Office meetings after a tense exchange about clothing. The next visit goes much better and the suit is called fabulous.,State Directive,blue,0,1,0,-3,2
E. O. 129,Department of War Rebrand,"Gives the Department of Defense the secondary name Department of War. Websites, signs and letterheads are replaced across the Pentagon.",Executive Order,red,-2,6,-2,-4,-6
E. O. 130,Golden Dome Initiative,Orders a missile defense shield over the entire country. Cost estimates are revised upward every quarter and the shield is also used as a reason to want Greenland.,Executive Order,red,-12,15,3,-2,-5
P. B. 112,Golden Dome Appropriations Act,Funds the first phase of the national missile shield with 175 billion dollars. Defense contractors hold a very happy press conference.,Policy Bill,red,-14,16,2,-1,-4
E. O. 131,Golden Fleet Order,"Commissions a new class of battleships named after the president, promised to be the largest, deadliest and best looking warships ever built.",Executive Order,red,-10,10,1,-6,-3
P. B. 113,Base Name Restoration Act,Restores old military base names by finding new soldiers with the same last names. One fort needs three different soldiers to spell out its full name.,Policy Bill,red,0,2,-1,-3,0
S. D. 107,Group Chat Security Review,Orders a review of messaging apps used by senior officials after a magazine editor was accidentally added to a group chat about strike plans. Nobody loses their job over it.,State Directive,red,0,-12,-6,4,-4
E. O. 132,Operation Midnight Hammer,"Authorizes B2 bomber strikes on three nuclear facilities, which the president declares totally obliterated. Allies ask for details and receive adjectives.",Executive Order,red,-4,18,4,-3,-10
E. O. 133,Operation Epic Fury,Authorizes a new air campaign against the same nuclear program declared obliterated nine months earlier. Gas prices rise by about a dollar a gallon.,Executive Order,red,-18,12,-14,-5,-15
E. O. 134,Operation Absolute Resolve,Authorizes a special operation to capture the Venezuelan president and bring him to New York for trial. The White House posts a photo of him in grey sweatpants.,Executive Order,red,4,14,5,-4,-12
E. O. 135,Strait Reopening Proclamation,"Announces the reopening of the Strait of Hormuz with a message telling the ships of the world to start their engines. Gas prices come down slowly, not like a rock.",Executive Order,red,14,6,8,0,10
S. D. 108,Military Birthday Parade,"Holds a parade of about 6,600 troops and 150 vehicles for the Army's 250th birthday, which is also the president's birthday. Metal plates protect the streets from the tanks.",State Directive,red,-4,5,-4,-2,0
P. B. 114,Defense Budget Expansion Act,Raises the annual military budget past 900 billion dollars. Some of it is set aside for battleships that do not exist yet.,Policy Bill,red,-10,14,0,-1,-2
E. O. 136,Mountain Restoration Order,Changes the name of Denali back to Mount McKinley. Alaska is not consulted.,Executive Order,orange,0,0,1,-2,-1
E. O. 137,Rose Garden Patio Order,Paves over the White House Rose Garden lawn and installs a patio with striped umbrellas and a premium sound system. The president can play music from his tablet.,Executive Order,orange,-1,0,-6,-4,0
E. O. 138,Oval Office Gilding Order,"Covers the Oval Office ceiling, door frames and decorative cherubs in gold. The White House says the gold is of the highest quality.",Executive Order,orange,-1,0,-5,-3,1
E. O. 139,East Wing Demolition Order,"Removes the East Wing of the White House to make room for a 90,000 square foot ballroom for 999 guests. The cost estimate keeps rising.",Executive Order,orange,-4,-1,-10,-8,0
P. B. 115,Ballroom Security Funding Act,Adds 1 billion dollars in taxpayer money for security around a ballroom that was supposed to be privately funded.,Policy Bill,orange,-8,3,-10,-5,0
E. O. 140,Presidential Walk of Fame Order,"Hangs gold framed portraits of every past president along the colonnade, with a photo of an autopen in place of one predecessor. Bronze plaques describe each president in very personal terms.",Executive Order,orange,0,0,-3,-6,-2
E. O. 141,Independence Arch Order,Orders a triumphal arch near Arlington modeled on the Arc de Triomphe and topped by a gilded winged figure. Locals start calling it the Arc de Trump.,Executive Order,orange,-3,0,-3,-3,1
S. D. 109,Institute of Peace Renaming,Renames the United States Institute of Peace after the sitting president. It becomes the first federal building named after a sitting president.,State Directive,orange,0,0,-4,-5,-3
S. D. 110,Kennedy Center Renaming,The board of the national arts center votes to add the president's name to the building. A federal judge later orders the letters taken down.,State Directive,orange,-1,0,-6,-8,-1
E. O. 142,Patriot Passport Order,Issues limited edition passports featuring the president's portrait and a short personal message telling visitors to behave.,Executive Order,orange,0,-1,-2,-4,-3
S. D. 111,National Park Pass Redesign,Puts the president's face next to George Washington on the annual national park pass. Hikers have mixed feelings.,State Directive,orange,0,0,-3,-3,0
S. D. 112,Federal Banner Order,"Hangs giant portrait banners of the president on federal agency buildings, including the Justice Department headquarters.",State Directive,orange,0,0,-5,-6,-1
P. B. 116,Interstate 47 Designation Act,Designates a new interstate highway from Texas to Montana named after the 47th president. Road sign makers get a busy year.,Policy Bill,orange,3,0,-2,-3,0
P. B. 117,Presidential Birthday Holiday Act,"Creates a federal holiday on June 14, which is both Flag Day and the president's birthday.",Policy Bill,orange,-4,0,-4,-4,0
P. B. 118,Mount Rushmore Expansion Study,Requests a study on adding a fifth face to Mount Rushmore. Geologists say the rock has opinions too.,Policy Bill,orange,-1,0,-5,-4,0
S. D. 113,Palm Beach Airport Renaming,Florida renames Palm Beach International Airport after the president. Travelers now land at an airport named after the person they voted for or against.,State Directive,orange,1,0,-1,-2,0
E. O. 143,Press Pool Takeover Order,Moves control of the White House press pool from the correspondents association to the White House. Seats go to outlets the administration prefers.,Executive Order,orange,0,0,-3,-18,-2
E. O. 144,Media Access Ban Order,Bans three major news outlets from the White House grounds over coverage the president calls fake news. The other networks stop providing pool coverage in solidarity.,Executive Order,orange,0,0,-6,-22,-3
E. O. 145,Official Policy by Social Post,Makes the president's social media posts an official channel for announcing federal policy. Every post ends with a thank you for your attention to this matter.,Executive Order,orange,-2,-2,1,-10,-4
S. D. 114,Official Account AI Image Policy,"Allows official White House accounts to post AI generated images of the president, including one as the pope and one wearing a crown. Religious leaders are not amused.",State Directive,orange,0,0,-6,-8,-4
S. D. 115,Shutdown Website Banner Directive,Orders federal agency websites to display banners blaming the opposition party for the government shutdown. Ethics lawyers take screenshots.,State Directive,orange,0,0,-4,-8,0
S. D. 116,Cabinet Praise Protocol,Turns televised cabinet meetings into a round of each secretary praising the president. Meetings run long.,State Directive,orange,0,0,-3,-5,0
S. D. 117,Oval Office Soda Button Restoration,Restores the button on the Resolute Desk that summons a cold diet soda. Staff report high usage.,State Directive,orange,0,0,1,-1,0
E. O. 146,South Lawn Cage Fight Order,Approves a professional fighting event inside an octagon on the White House South Lawn for the president's 80th birthday. Fighters walk out from the Oval Office.,Executive Order,orange,2,0,6,-3,-1
S. D. 118,Great American State Fair Directive,Sets up a national state fair on the National Mall for the 250th anniversary. Attendance stays low in record heat and the Ferris wheel spins mostly empty.,State Directive,orange,-3,0,-4,-3,0
S. D. 119,Independence Day Rally Directive,Turns the 250th Independence Day celebration into a rally on the National Mall after several artists withdraw from the concerts.,State Directive,orange,-1,-1,-5,-4,-1
S. D. 120,Soccer Nation Proclamation,Declares the United States a soccer country after hosting the World Cup. The president claims he kept the trophy and FIFA says the one in the Oval Office is a replica.,State Directive,orange,4,0,5,-2,2
P. B. 119,One Big Beautiful Bill,"Combines tax cuts, no tax on tips, new investment accounts for children and more border spending into one very long bill. It is signed on July 4.",Policy Bill,purple,10,6,4,-2,0
P. B. 120,No Tax on Tips Act,Exempts tips from federal income tax for restaurant and service workers. Waiters approve and accountants start asking what counts as a tip.,Policy Bill,purple,4,0,12,3,0
E. O. 147,Trump Accounts Enrollment Order,"Automatically enrolls every child under 18 in a government seeded investment account with a 1,000 dollar starting deposit.",Executive Order,purple,-6,0,12,2,0
E. O. 148,TrumpRx Launch Order,Launches a federal website listing discounted prescription drugs from companies that cut prices in exchange for tariff exemptions. The site does not sell drugs and sends users to the manufacturers.,Executive Order,purple,3,0,8,1,1
P. B. 121,Most Favored Nation Drug Pricing Act,Ties American prescription drug prices to the lowest price paid by peer countries. Drug companies warn about lower profits and other countries warn about higher prices.,Policy Bill,purple,4,0,12,3,-4
E. O. 149,Government Efficiency Department Order,"Creates the Department of Government Efficiency, led by a billionaire who waves a chainsaw on stage, with a target of 2 trillion dollars in savings.",Executive Order,purple,6,-2,3,-6,-1
S. D. 121,Efficiency Department Sunset,Dissolves the efficiency department eight months early after savings fall far below the original promise. Its leader leaves with a ceremonial gold key.,State Directive,purple,-2,0,-3,-2,0
P. B. 122,Federal Workforce Reduction Act,Cuts federal staff across many agencies to meet efficiency targets. Some workers are fired and then rehired when agencies realize they needed them.,Policy Bill,purple,5,-4,-6,-3,0
P. B. 123,Appropriations Lapse,"Congress fails to pass a budget and the federal government shuts down. Flights are cancelled, federal workers go unpaid and it becomes the longest shutdown in history.",Policy Bill,purple,-18,-8,-12,-4,-3
P. B. 124,Shutdown Ending Resolution,Reopens the federal government after 43 days with back pay for federal workers and a reversal of layoffs made during the shutdown.,Policy Bill,purple,12,4,6,2,2
P. B. 125,Air Traffic Controller Pay Guarantee,Guarantees pay for air traffic controllers during any future shutdown so flights keep moving.,Policy Bill,purple,6,5,8,2,0
P. B. 126,Third Term Study Resolution,Asks whether the two term limit could be read differently. The president says the law is very strong and then puts on a 2028 hat.,Policy Bill,purple,0,0,-8,-6,-3
E. O. 150,Plastic Straw Restoration Order,Ends the federal push for paper straws and brings plastic straws back to federal buildings. Milkshake drinkers celebrate.,Executive Order,purple,1,0,4,-1,0
E. O. 151,Showerhead Freedom Order,Removes federal water pressure limits on showerheads. Water utilities are less excited than the president.,Executive Order,purple,1,0,5,0,0
E. O. 152,Official Language Order,Designates English as the official language of the United States and removes some multilingual service requirements.,Executive Order,purple,0,0,2,-3,-3
S. D. 122,Museum Content Review Directive,Orders a review of Smithsonian exhibits to check whether they present American history in a positive enough way.,State Directive,purple,0,0,-3,-5,-1`;

function parseSimpleCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  cells.push(cur.trim());
  return cells;
}

function buildDefaultPolicyBills(): PolicyBill[] {
  const lines = RAW_DEFAULT_BILLS_CSV.trim().split(/\r?\n/);
  const dataLines = lines.slice(1);

  return dataLines.map((line, idx) => {
    const [
      rawCode = '',
      rawTitle = '',
      rawSummary = '',
      rawCategory = '',
      rawColor = '',
      rawEcon = '0',
      rawSec = '0',
      rawAppr = '0',
      rawMedia = '0',
      rawDipl = '0',
    ] = parseSimpleCsvLine(line);

    const upperCat = rawCategory.toUpperCase();
    const category: BillCategory = upperCat.includes('STATE')
      ? 'STATE DIRECTIVE'
      : upperCat.includes('POLICY')
        ? 'POLICY BILL'
        : 'EXECUTIVE ORDER';

    const ribbonColor = TAB_COLOR_MAP[rawColor.toLowerCase()] || '#D97706';

    const economy = Number(rawEcon) || 0;
    const security = Number(rawSec) || 0;
    const approval = Number(rawAppr) || 0;
    const media = Number(rawMedia) || 0;
    const diplomacy = Number(rawDipl) || 0;

    const clauses = [
      `Sec. 1. Direct all relevant Cabinet departments to implement ${rawTitle} (${rawCode}) effective immediately upon presidential signature.`,
      `Sec. 2. Authorize the Office of Management and Budget to enforce compliance across all federal jurisdictions.`,
    ];

    return {
      id: `bill-default-${idx + 1}`,
      code: rawCode,
      title: rawTitle,
      category,
      summary: rawSummary,
      clauses,
      ribbonColor,
      effects: {
        economy,
        security,
        approval,
        media,
        diplomacy,
      },
      twittlyReactions: createDefaultThreeReactions(rawCode, rawTitle),
      activeOnDesk: true,
    };
  });
}

export const DEFAULT_POLICY_BILLS: PolicyBill[] = buildDefaultPolicyBills();
