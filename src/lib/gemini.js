import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const isGeminiConfigured = !!(apiKey && apiKey !== 'your_gemini_api_key' && apiKey !== '');

// Initialize Gemini Client if key is available
let genAI = null;
if (isGeminiConfigured) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Google Generative AI:', error);
  }
}

/**
 * Fallback Mock AI Analysis Generator
 * Analyzes the raw answers and returns customized insights based on answers.
 */
function getMockAIAnalysis(answers) {
  const sources = [];
  const recs = [];
  let challenge = {};
  let insight = "";

  // 1. Analyze transportation
  const hasCar = answers.hasCar === 'yes' || answers.hasCar === true;
  const carType = answers.carType || 'none';
  const miles = parseInt(answers.weeklyMiles || '0', 10);
  const flights = parseInt(answers.annualFlights || '0', 10);

  if (hasCar && (carType === 'suv' || carType === 'sedan') && miles > 100) {
    sources.push(`Transportation: Commuting ${miles} miles/week in a fossil-fuel ${carType.toUpperCase()}`);
    recs.push({
      title: "Optimize Your Commute",
      description: "Swap 1-2 driving days for public transit or carpooling. You could save hundreds of kilograms of CO₂ annually.",
      impact: "High (reduces emissions by ~0.8 tons/year)"
    });
  } else if (flights > 2) {
    sources.push(`Transportation: High flight frequency (${flights} flights/year)`);
    recs.push({
      title: "Offset Flight Emissions",
      description: "Consider booking direct flights, traveling by train for shorter distances, or contributing to certified carbon offset programs.",
      impact: "High (reduces emissions by ~1.5 tons/year)"
    });
  }

  // 2. Analyze food
  const diet = answers.diet || 'average';
  const foodWaste = answers.foodWaste || 'occasionally';

  if (diet === 'heavy-meat' || diet === 'average') {
    sources.push(`Diet: Frequent meat consumption (${diet === 'heavy-meat' ? 'daily heavy' : 'moderate'} red meat & poultry)`);
    recs.push({
      title: "Adopt Meatless Mondays",
      description: "Replacing beef and pork with plant-based alternatives just one day a week significantly lowers your dietary footprint.",
      impact: "Medium (reduces emissions by ~0.4 tons/year)"
    });
  }
  if (foodWaste === 'frequently' || foodWaste === 'occasionally') {
    sources.push("Food Waste: Room for improvement in meal planning and composting");
    recs.push({
      title: "Smart Meal Planning",
      description: "Plan meals weekly and store leftovers in airtight containers. Compost organic scraps rather than throwing them in standard waste.",
      impact: "Medium (reduces emissions by ~0.3 tons/year)"
    });
  }

  // 3. Analyze energy
  const cleanEnergy = parseInt(answers.cleanEnergyShare || '0', 10);
  const heatSource = answers.heatingSource || 'electric';
  const homeSize = answers.homeSize || 'medium';

  if (cleanEnergy < 50) {
    sources.push(`Home Energy: Low clean energy usage (${cleanEnergy}% renewable share)`);
    recs.push({
      title: "Upgrade to Renewable Energy",
      description: "Contact your utility provider to switch your home electricity plan to a green/renewable option (solar or wind wind-mix).",
      impact: "High (reduces emissions by ~1.2 tons/year)"
    });
  }
  if (heatSource === 'gas' || heatSource === 'electric') {
    sources.push(`Home Climate: Heating using ${heatSource === 'gas' ? 'natural gas' : 'standard electric grid electricity'}`);
    recs.push({
      title: "Improve Thermal Efficiency",
      description: "Seal gaps in windows and doors, install a programmable thermostat, or set heating 1-2 degrees lower during winter.",
      impact: "Medium (reduces emissions by ~0.4 tons/year)"
    });
  }

  // 4. Analyze shopping
  const recycle = answers.recycleHabits || 'sometimes';
  const shopping = answers.shoppingFrequency || 'monthly';

  if (shopping === 'weekly') {
    sources.push("Consumer Goods: High shopping rate for new clothes and electronics");
    recs.push({
      title: "Embrace Circular Shopping",
      description: "Buy secondhand, rent outfits for special events, and choose refurbished items for electronics.",
      impact: "Medium (reduces emissions by ~0.5 tons/year)"
    });
  }
  if (recycle !== 'always') {
    sources.push("Recycling: Incomplete recycling of household waste materials");
    recs.push({
      title: "Standardize Recycling Habits",
      description: "Set up separate bins for paper, plastics, glass, and metals. Familiarize yourself with local recycling regulations.",
      impact: "Low (reduces emissions by ~0.2 tons/year)"
    });
  }

  // Fallback defaults if we don't have enough specific sources
  if (sources.length === 0) {
    sources.push("Daily Habits: Minor inefficiencies in transport and shopping");
    recs.push({
      title: "Keep it Up & Educate Others",
      description: "Your carbon footprint is already quite low! Share your journey with friends to inspire broader change.",
      impact: "Low"
    });
  }

  // Limit recommendations to 3
  const finalRecs = recs.slice(0, 3);
  if (finalRecs.length < 3) {
    finalRecs.push({
      title: "Unplug Idle Devices",
      description: "Unplug chargers and appliances when not in use. Phantom loads account for up to 10% of residential energy use.",
      impact: "Low (reduces emissions by ~0.1 tons/year)"
    });
  }

  // Generate a matching Weekly Challenge
  if (diet === 'heavy-meat' || diet === 'average') {
    challenge = {
      title: "Plant-Powered Lunch Week",
      description: "Eat completely plant-based (vegetarian or vegan) meals for lunch from Monday to Friday this week.",
      points: 150
    };
  } else if (miles > 50 && carType !== 'none') {
    challenge = {
      title: "Active Transit Challenge",
      description: "Replace at least two short car trips (under 2 miles) with walking, cycling, or public transit.",
      points: 200
    };
  } else if (cleanEnergy < 50) {
    challenge = {
      title: "Power-Down Hour",
      description: "Spend 1 hour each evening with all major screens turned off, utilizing candles, books, or family conversation.",
      points: 100
    };
  } else {
    challenge = {
      title: "Zero Waste Shopping",
      description: "Shop for groceries this week without buying any single-use plastic packaging.",
      points: 180
    };
  }

  // Motivational Insight
  const insights = [
    "Small decisions multiply into massive impacts. By taking this assessment, you've taken the first step toward a carbon-neutral lifestyle.",
    "Every metric ton of CO₂ we keep out of the atmosphere helps secure a livable future. You are actively contributing to that goal.",
    "The journey to zero emissions isn't about perfection; it is about progress. Your efforts in commuting and diet are making a tangible difference!",
    "Great work on keeping your footprint low! You are setting an excellent example for your friends, family, and community."
  ];
  insight = insights[Math.floor(Math.random() * insights.length)];

  return {
    biggestEmissionSources: sources.slice(0, 2),
    recommendations: finalRecs,
    weeklyChallenge: challenge,
    motivationalInsight: insight,
    isMock: true
  };
}

/**
 * Main Analysis Entry Point
 * Calls Gemini if configured, otherwise falls back to the local mock analyzer
 */
export async function analyzeFootprint(answers) {
  if (!isGeminiConfigured || !genAI) {
    console.log('Gemini API is not configured. Returning local mock analysis.');
    return getMockAIAnalysis(answers);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const prompt = `
You are an expert environmental scientist and sustainability AI coach called "EcoMind AI".
Analyze the following user carbon footprint assessment data:

Transportation:
- Owns a car: ${answers.hasCar ? 'Yes' : 'No'}
- Car type: ${answers.carType || 'N/A'}
- Weekly driving miles: ${answers.weeklyMiles || 0}
- Weekly public transit hours: ${answers.publicTransitHours || 0}
- Annual flights taken: ${answers.annualFlights || 0}

Food Habits:
- Diet profile: ${answers.diet || 'N/A'}
- Food waste frequency: ${answers.foodWaste || 'N/A'}
- Prefers local food: ${answers.localFoodPreference || 'N/A'}

Home Energy:
- Home size: ${answers.homeSize || 'N/A'}
- Heating/cooling energy source: ${answers.heatingSource || 'N/A'}
- Clean energy share: ${answers.cleanEnergyShare || 0}%

Shopping Habits:
- New items shopping frequency: ${answers.shoppingFrequency || 'N/A'}
- Recycling habits: ${answers.recycleHabits || 'N/A'}
- Prefers secondhand items: ${answers.secondhandPreference || 'N/A'}

Calculated Annual Emissions: ${answers.annualEmissions || 'N/A'} metric tons of CO2.
Calculated Sustainability Rating Score: ${answers.totalScore || 'N/A'} out of 100.

Provide a detailed report in JSON format matching the schema below:
{
  "biggestEmissionSources": ["string describing source 1", "string describing source 2"],
  "recommendations": [
    {
      "title": "Short title of recommendation 1",
      "description": "Actionable, specific recommendation description",
      "impact": "High/Medium/Low (with approximate CO2 saving estimation)"
    },
    {
      "title": "Short title of recommendation 2",
      "description": "Actionable, specific recommendation description",
      "impact": "High/Medium/Low (with approximate CO2 saving estimation)"
    },
    {
      "title": "Short title of recommendation 3",
      "description": "Actionable, specific recommendation description",
      "impact": "High/Medium/Low (with approximate CO2 saving estimation)"
    }
  ],
  "weeklyChallenge": {
    "title": "A fun, engaging weekly challenge title matching their profile",
    "description": "Clear instructions on how to complete this weekly challenge",
    "points": 100 -- points between 50 and 200 based on difficulty
  },
  "motivationalInsight": "A single sentence of highly motivating and encouraging sustainability insight based on their data."
}

Do not include any markup other than JSON in your response. Ensure the output is valid JSON.
`;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    
    // Parse response
    const parsedData = JSON.parse(textResponse);
    return {
      ...parsedData,
      isMock: false
    };
  } catch (error) {
    console.error('Error in Gemini API analysis:', error);
    // If the API call fails (e.g. rate limit, auth error, bad key), fall back gracefully
    return getMockAIAnalysis(answers);
  }
}
