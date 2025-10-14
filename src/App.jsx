import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, DollarSign, Package, Brain, CheckSquare } from 'lucide-react';

// ============================================
// CONFIGURATION: Add new biases here
// ============================================
const BIASES_DATABASE = [
  {
    id: 'anchoring',
    name: 'Anchoring Bias',
    description: 'You\'re being influenced by the first price you saw',
    detectionLogic: (data) => {
      return data.hasOriginalPrice || data.showsComparePrice;
    },
    explanation: 'The original higher price is serving as an anchor, making the current price seem like a better deal than it actually is.',
    advice: 'Ask yourself: Would I buy this at the current price if I had never seen the original price?'
  },
  {
    id: 'scarcity',
    name: 'Scarcity Heuristic',
    description: 'Limited availability is creating urgency',
    detectionLogic: (data) => {
      return data.limitedTime || data.lowStock;
    },
    explanation: 'The perception of scarcity is triggering fear of missing out (FOMO), potentially rushing your decision.',
    advice: 'Consider: Will this product truly be unavailable later, or is this a marketing tactic? Do you really need it now?'
  },
  {
    id: 'social_proof',
    name: 'Social Proof Bias',
    description: 'Others\' choices are influencing your decision',
    detectionLogic: (data) => {
      return data.bestseller || data.hasReviews || data.trending;
    },
    explanation: 'You\'re being influenced by what others have chosen rather than evaluating if it meets your specific needs.',
    advice: 'Ask: Does this product actually solve MY problem, regardless of its popularity?'
  },
  {
    id: 'bundle',
    name: 'Bundling Effect',
    description: 'A bundle deal is making you buy more than needed',
    detectionLogic: (data) => {
      return data.bundleDeal;
    },
    explanation: 'Bundled items make you feel you\'re getting more value, but you may not need all the items included.',
    advice: 'Calculate: What\'s the individual cost of items you actually need? Are you paying for things you won\'t use?'
  },
  {
    id: 'decoy',
    name: 'Decoy Effect',
    description: 'A third option is making another seem more attractive',
    detectionLogic: (data) => {
      return data.multipleTiers;
    },
    explanation: 'A less attractive option (decoy) has been added to make another option seem more reasonable or valuable.',
    advice: 'Focus on the option that best meets your needs, ignoring the comparison products entirely.'
  },
  {
    id: 'sunk_cost',
    name: 'Sunk Cost Fallacy',
    description: 'Past spending is influencing future decisions',
    detectionLogic: (data) => {
      return data.partOfCollection || data.upgradeExisting;
    },
    explanation: 'You\'re considering this purchase because of money already spent, rather than evaluating it independently.',
    advice: 'Past spending is gone. Decide based only on whether this purchase provides value going forward.'
  },
  {
    id: 'framing',
    name: 'Framing Effect',
    description: 'How the offer is presented is affecting your perception',
    detectionLogic: (data) => {
      return data.emphasizesSavings || data.hasOriginalPrice;
    },
    explanation: 'The presentation emphasizes savings rather than actual cost, making it seem more attractive.',
    advice: 'Reframe: Would you buy this at the "discounted" price if it was the regular price? Is it actually cheap?'
  },
  {
    id: 'endowment',
    name: 'Endowment Effect',
    description: 'You value it more because you\'re imagining owning it',
    detectionLogic: (data) => {
      return data.freeTrial || data.tryBefore;
    },
    explanation: 'Once you\'ve tried or imagined owning something, you tend to overvalue it and find it harder to give up.',
    advice: 'Remember: You don\'t own it yet. Evaluate objectively whether it\'s worth the price.'
  },
  {
    id: 'loss_aversion',
    name: 'Loss Aversion',
    description: 'Fear of missing out is driving your decision',
    detectionLogic: (data) => {
      return data.limitedTime || data.exclusiveOffer;
    },
    explanation: 'You\'re more motivated by avoiding loss (missing the deal) than by the actual gain.',
    advice: 'Think: What am I actually losing if I don\'t buy this? Usually, it\'s just a marketing deadline.'
  },
  {
    id: 'reciprocity',
    name: 'Reciprocity Bias',
    description: 'Free gifts or samples make you feel obligated',
    detectionLogic: (data) => {
      return data.freeGift || data.freeTrial;
    },
    explanation: 'Receiving something "free" creates a psychological obligation to reciprocate by purchasing.',
    advice: 'Remember: The "free" item is a marketing cost, not a gift. You don\'t owe them anything.'
  }
];

// ============================================
// SHOPPING CONTEXT OPTIONS
// ============================================
const SHOPPING_OPTIONS = [
  { id: 'hasOriginalPrice', label: 'Shows original/higher price (crossed out)', icon: '💰' },
  { id: 'showsComparePrice', label: 'Compares to competitor prices', icon: '📊' },
  { id: 'limitedTime', label: 'Says "Limited Time" or "Ends Soon"', icon: '⏰' },
  { id: 'lowStock', label: 'Shows low stock ("Only X left")', icon: '📦' },
  { id: 'bestseller', label: 'Marked as "Bestseller" or "Popular"', icon: '⭐' },
  { id: 'hasReviews', label: 'Highlights customer reviews/ratings', icon: '⭐' },
  { id: 'trending', label: 'Says "Trending" or "Most bought"', icon: '📈' },
  { id: 'bundleDeal', label: 'Bundle, combo, or set deal', icon: '📦' },
  { id: 'multipleTiers', label: 'Multiple options (Basic/Pro/Premium)', icon: '🎯' },
  { id: 'partOfCollection', label: 'Part of a collection you\'re building', icon: '🧩' },
  { id: 'upgradeExisting', label: 'Upgrade to something you already own', icon: '⬆️' },
  { id: 'emphasizesSavings', label: 'Emphasizes how much you "save"', icon: '💵' },
  { id: 'freeTrial', label: 'Offers free trial period', icon: '🆓' },
  { id: 'tryBefore', label: 'Try before you buy / demo available', icon: '🔍' },
  { id: 'exclusiveOffer', label: 'Says "Exclusive" or "Members only"', icon: '🎫' },
  { id: 'freeGift', label: 'Includes free gift or bonus item', icon: '🎁' }
];

// ============================================
// CURRENCY CONFIGURATION
// ============================================
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', countries: ['US', 'USA'] },
  { code: 'EUR', symbol: '€', name: 'Euro', countries: ['DE', 'FR', 'IT', 'ES', 'NL'] },
  { code: 'GBP', symbol: '£', name: 'British Pound', countries: ['GB', 'UK'] },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', countries: ['IN', 'IND'] },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', countries: ['JP', 'JPN'] },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', countries: ['CN', 'CHN'] },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', countries: ['AU', 'AUS'] },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', countries: ['CA', 'CAN'] },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', countries: ['CH', 'CHE'] },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', countries: ['BR', 'BRA'] },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', countries: ['MX', 'MEX'] },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', countries: ['ZA', 'ZAF'] },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', countries: ['SG', 'SGP'] },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', countries: ['HK', 'HKG'] },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', countries: ['KR', 'KOR'] },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', countries: ['SE', 'SWE'] },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', countries: ['NO', 'NOR'] },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', countries: ['NZ', 'NZL'] },
];

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function ShoppingBiasDetector() {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [detectedBiases, setDetectedBiases] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Auto-detect currency based on user's location
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const userCountry = data.country_code;
        
        const matchedCurrency = CURRENCIES.find(curr => 
          curr.countries.includes(userCountry)
        );
        
        if (matchedCurrency) {
          setCurrency(matchedCurrency);
        }
      } catch (error) {
        console.log('Using default currency');
      }
    };
    
    detectCurrency();
  }, []);

  // Toggle checkbox selection
  const toggleOption = (optionId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  // Analyze for biases
  const analyzeBiases = () => {
    const analysisData = {
      itemName,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      ...selectedOptions
    };

    const detected = BIASES_DATABASE.filter(bias => 
      bias.detectionLogic(analysisData)
    );

    setDetectedBiases(detected);
    setShowResults(true);
  };

  const resetForm = () => {
    setItemName('');
    setPrice('');
    setOriginalPrice('');
    setSelectedOptions({});
    setDetectedBiases([]);
    setShowResults(false);
  };

  const formatPrice = (amount) => {
    if (!amount) return '';
    return `${currency.symbol}${parseFloat(amount).toFixed(2)}`;
  };

  const selectedCount = Object.values(selectedOptions).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-12 h-12 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Shopping Bias Detector</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Quick check: Are cognitive biases influencing your purchase?
          </p>
        </div>

        {/* Currency Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-3">
            <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
            <label className="font-semibold text-gray-700">Your Currency</label>
          </div>
          <select
            value={currency.code}
            onChange={(e) => setCurrency(CURRENCIES.find(c => c.code === e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {CURRENCIES.map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.symbol} - {curr.name} ({curr.code})
              </option>
            ))}
          </select>
        </div>

        {/* Input Form */}
        {!showResults ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Quick Details
            </h2>

            <div className="space-y-6">
              {/* Item Name */}
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline mr-2" />
                  What are you buying?
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Wireless Headphones"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Current Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">
                      {currency.symbol}
                    </span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="99.99"
                      className="w-full p-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Original Price (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">
                      {currency.symbol}
                    </span>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="149.99"
                      className="w-full p-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Shopping Context Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block font-semibold text-gray-700">
                    <CheckSquare className="w-4 h-4 inline mr-2" />
                    What's the listing showing? (select all that apply)
                  </label>
                  {selectedCount > 0 && (
                    <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                      {selectedCount} selected
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                  {SHOPPING_OPTIONS.map(option => (
                    <label
                      key={option.id}
                      className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${
                        selectedOptions[option.id]
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOptions[option.id] || false}
                        onChange={() => toggleOption(option.id)}
                        className="mt-1 mr-3 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="flex-1">
                        <span className="mr-2">{option.icon}</span>
                        <span className="text-gray-700">{option.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={analyzeBiases}
                disabled={!itemName || !price}
                className="w-full bg-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-lg"
              >
                <Brain className="w-6 h-6 mr-2" />
                Analyze for Biases
              </button>
              
              {(!itemName || !price) && (
                <p className="text-center text-gray-500 text-sm">
                  Enter item name and price to continue
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Analysis Results
              </h2>
              <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-6 h-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">
                      {itemName} - {formatPrice(price)}
                    </p>
                    {originalPrice && (
                      <p className="text-gray-600 line-through">
                        Was: {formatPrice(originalPrice)}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedCount} marketing tactic{selectedCount !== 1 ? 's' : ''} detected in listing
                    </p>
                  </div>
                </div>
              </div>

              {detectedBiases.length > 0 ? (
                <div>
                  <div className="flex items-center mb-4">
                    <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
                    <p className="text-lg font-semibold text-gray-700">
                      {detectedBiases.length} cognitive bias{detectedBiases.length > 1 ? 'es' : ''} may be affecting your decision
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border-l-4 border-green-600 p-4">
                  <p className="text-green-800 font-semibold">
                    ✓ No obvious biases detected. This appears to be a straightforward purchase decision!
                  </p>
                </div>
              )}
            </div>

            {/* Detected Biases */}
            {detectedBiases.map((bias, index) => (
              <div key={bias.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                <div className="flex items-start mb-3">
                  <div className="bg-orange-100 rounded-full p-2 mr-3 flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {bias.name}
                    </h3>
                    <p className="text-orange-600 font-semibold mb-3">
                      {bias.description}
                    </p>
                  </div>
                </div>

                <div className="ml-14 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">What's happening:</p>
                    <p className="text-gray-600">{bias.explanation}</p>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                    <p className="font-semibold text-blue-800 mb-1">💡 Counter this bias:</p>
                    <p className="text-blue-900">{bias.advice}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={resetForm}
                className="flex-1 bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition"
              >
                Analyze Another Item
              </button>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-500 text-sm pb-8">
          <p className="mb-2">
            Tracking {BIASES_DATABASE.length} cognitive biases • {SHOPPING_OPTIONS.length} shopping scenarios
          </p>
          <p>
            Make smarter shopping decisions by recognizing psychological tactics
          </p>
        </div>
      </div>
    </div>
  );
}
