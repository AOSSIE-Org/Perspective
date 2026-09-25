export interface PresetTopic {
  id: string;
  title: string;
  titleHi?: string;
  fallbackTitle: string;
  url: string;
  publishedAt: string;
  curatedAt: string;
  biasScore: {
    bias_score: number;
    explanation: string;
    bias_category: string;
  };
  analysisResult: {
    cleaned_text: string;
    sentiment: string;
    score: number;
    facts: Array<{
      claim: string;
      verified: boolean;
      sources: string[];
      details: string;
    }>;
    perspective: string;
  };
}

export const TOPICS_CURATED_AT = "2026-09-25";
export const TOPIC_MAX_AGE_DAYS = 45;

export const PRESET_TOPICS: PresetTopic[] = [
  {
    id: "fed-monetary-pivot-2026",
    title: "Fed Interest Rates vs Inflation Horizon",
    titleHi: "फेडरल रिजर्व ब्याज दरें बनाम मुद्रास्फीति परिदृश्य",
    fallbackTitle: "Fed Interest Rates vs Inflation Horizon",
    url: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm",
    publishedAt: "2026-09-16",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 22,
      explanation: "Central banking release prioritizing monetary tightening and price stability over near-term industrial borrowing costs.",
      bias_category: "Monetary Policy & Macroeconomics",
    },
    analysisResult: {
      cleaned_text:
        "The Federal Open Market Committee delivered its September 2026 monetary policy statement, maintaining the federal funds benchmark range at 5.25% to 5.50% while projecting persistent baseline inflation pressures driven by labor tightness and energy transition capital expenditures.",
      sentiment: "Neutral / Cautious",
      score: 91,
      facts: [
        {
          claim: "The FOMC voted to maintain the policy target rate at 5.25%-5.50% at its September 2026 meeting.",
          verified: true,
          sources: ["Federal Reserve Monetary Policy Release", "Bureau of Labor Statistics CPI Report"],
          details: "Core PCE inflation moderated to 2.8% annualized, remaining above the statutory 2.0% objective.",
        },
        {
          claim: "Quantitative tightening balance sheet runoff continues at capped monthly thresholds.",
          verified: true,
          sources: ["Federal Reserve Open Market Operations Tracker", "Treasury Borrowing Advisory Committee"],
          details: "Treasury and agency mortgage-backed securities reinvestment caps remain intact through Q4 2026.",
        },
      ],
      perspective:
        "While preserving high policy rates protects against second-round inflationary spirals, extended tight credit disproportionately strains capital-intensive infrastructure, emerging market debt service, and small business lending. A flexible forward guidance framework is vital to prevent overtightening into a growth slowdown.",
    },
  },
  {
    id: "unga81-sea-level-declaration",
    title: "UN Sea Level Declaration vs Island Sovereignty",
    titleHi: "संयुक्त राष्ट्र समुद्री जलस्तर घोषणा बनाम द्वीपीय संप्रभुता",
    fallbackTitle: "UN Sea Level Declaration vs Island Sovereignty",
    url: "https://www.un.org/press/en/2026/ga12891.doc.htm",
    publishedAt: "2026-09-24",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 28,
      explanation: "Multilateral diplomatic framework emphasizing international legal consensus and loss-and-damage climate financing.",
      bias_category: "International Law & Climate Resilience",
    },
    analysisResult: {
      cleaned_text:
        "At the 81st UN General Assembly High-Level Summit, member states adopted a landmark legal declaration safeguarding the continuous statehood, maritime baseline rights, and exclusive economic zones of low-lying small island developing nations irrespective of physical land submergence caused by rising sea levels.",
      sentiment: "Urgent & Constructive",
      score: 94,
      facts: [
        {
          claim: "The UNGA resolution affirms that statehood and maritime entitlements persist despite sea-level rise induced shoreline changes.",
          verified: true,
          sources: ["United Nations General Assembly 81st Session Records", "Alliance of Small Island States (AOSIS)"],
          details: "Over 160 member states co-sponsored the binding legal recognition of fixed maritime boundaries.",
        },
        {
          claim: "Global mean sea levels rose at an accelerated rate of 4.9 mm/year over the past half-decade.",
          verified: true,
          sources: ["World Meteorological Organization (WMO) 2026 State of Climate", "IPCC AR7 Technical Report"],
          details: "Accelerated thermal expansion and Greenland ice shelf discharge remain primary contributors.",
        },
      ],
      perspective:
        "Legal recognition of permanent statehood is an essential moral victory for vulnerable Pacific and Caribbean nations. However, legal definitions must be paired with immediately disbursed Loss and Damage capital and climate migration protections before physical habitability thresholds are breached.",
    },
  },
  {
    id: "brics18-new-delhi-declaration",
    title: "BRICS Multi-Currency Trade vs Dollar Reserve",
    titleHi: "ब्रिक्स बहु-मुद्रा व्यापार बनाम डॉलर आरक्षित व्यवस्था",
    fallbackTitle: "BRICS Multi-Currency Trade vs Dollar Reserve",
    url: "https://www.mea.gov.in/bilateral-documents.htm?dtl/38210/18th_BRICS_Summit_Declaration",
    publishedAt: "2026-09-13",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 35,
      explanation: "Global South geopolitical framing prioritizing cross-border local currency settlement mechanisms and de-risking trade.",
      bias_category: "Geopolitics & International Trade",
    },
    analysisResult: {
      cleaned_text:
        "The 18th BRICS Leaders Summit concluded in New Delhi with the unanimous endorsement of the New Delhi Economic Action Plan, operationalizing a shared cross-border payment gateway (BRICS Pay) and expanding bilateral national currency trade settlements across expanded member states.",
      sentiment: "Strategic & Transformative",
      score: 89,
      facts: [
        {
          claim: "Intra-BRICS trade settled in local non-USD currencies reached 48% of total bilateral volume in 2026.",
          verified: true,
          sources: ["New Development Bank Annual Report 2026", "Reserve Bank of India International Trade Bulletin"],
          details: "Bilateral currency swaps and local currency energy contracts accelerated settlement transitions.",
        },
        {
          claim: "The summit expanded institutional financing facilities within the Contingent Reserve Arrangement (CRA).",
          verified: true,
          sources: ["Ministry of External Affairs Official Release", "BRICS Financial Cooperation Taskforce"],
          details: "Liquidity facilities were expanded to support currency stability among ten full member economies.",
        },
      ],
      perspective:
        "Local currency settlement lowers exchange rate transaction costs and insulates developing economies from unilateral financial sanctions. Nevertheless, currency convertibility restrictions, varying capital control regimes, and inflation differentials must be systematically harmonized to build a stable multipolar financial architecture.",
    },
  },
  {
    id: "eu-ai-act-high-risk-enforcement",
    title: "EU AI Act High-Risk Rules vs Innovation",
    titleHi: "यूरोपीय एआई अधिनियम उच्च-जोखिम नियम बनाम नवाचार",
    fallbackTitle: "EU AI Act High-Risk Rules vs Innovation",
    url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai-act-enforcement",
    publishedAt: "2026-09-18",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 38,
      explanation: "Regulatory compliance framing emphasizing algorithmic safety, training transparency, and mandatory conformity audits.",
      bias_category: "Artificial Intelligence Policy & Governance",
    },
    analysisResult: {
      cleaned_text:
        "The European Artificial Intelligence Board initiated statutory enforcement under the EU AI Act for high-risk generative foundation models, requiring frontier AI developers to submit audited systemic risk assessments, comprehensive copyright training disclosures, and verifiable energy footprint metrics.",
      sentiment: "Cautious / Regulatory",
      score: 92,
      facts: [
        {
          claim: "High-risk AI models exceeding 10^25 FLOPs training compute must undergo independent third-party audits.",
          verified: true,
          sources: ["European AI Office Regulatory Guidance", "OECD AI Observatory 2026"],
          details: "Non-compliance penalties reach up to €35 million or 7% of global annual turnover.",
        },
        {
          claim: "Over 60% of European tech startups report increased compliance expenditures associated with conformity assessments.",
          verified: true,
          sources: ["European Innovation Council Survey", "Center for European Policy Studies (CEPS)"],
          details: "Venture investment in EU open-source foundation models showed divergence compared to North American benchmarks.",
        },
      ],
      perspective:
        "Rigorous auditing safeguards civil liberties, consumer privacy, and copyright integrity against algorithmic exploitation. Yet regulatory frameworks must provide streamlined compliance sandboxes for early-stage startups and open-source researchers to prevent consolidating AI development strictly into incumbent tech monopolies.",
    },
  },
  {
    id: "who-pandemic-accord-amendments",
    title: "WHO Pandemic Agreement vs Vaccine Equity",
    titleHi: "डब्ल्यूएचओ महामारी समझौता बनाम टीका समानता",
    fallbackTitle: "WHO Pandemic Agreement vs Vaccine Equity",
    url: "https://www.who.int/news/item/2026-08-28-intergovernmental-negotiating-body-finalizes-pandemic-accord",
    publishedAt: "2026-08-28",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 25,
      explanation: "Global public health perspective balancing pathogen genetic sequencing access with guaranteed pharmaceutical manufacturing transfer.",
      bias_category: "Global Health & Bio-Security",
    },
    analysisResult: {
      cleaned_text:
        "The WHO Intergovernmental Negotiating Body completed final draft ratifications for the Global Pandemic Accord, establishing the Pathogen Access and Benefit-Sharing (PABS) system requiring vaccine manufacturers to allocate 20% of real-time production to developing nations during declared global health emergencies.",
      sentiment: "Constructive & Equitable",
      score: 95,
      facts: [
        {
          claim: "The PABS system mandates 10% free donation and 10% not-for-profit pricing of emergency therapeutics and vaccines.",
          verified: true,
          sources: ["World Health Organization PABS Framework", "The Lancet Global Health Policy Review"],
          details: "Real-time genome surveillance data sharing is legally tied to equitable distribution guarantees.",
        },
        {
          claim: "Regional mRNA production hubs in Latin America and Africa received international technology transfer accreditation.",
          verified: true,
          sources: ["Medicines Patent Pool (MPP) 2026 Report", "Africa CDC Annual Briefing"],
          details: "Decentralized manufacturing facilities aim to reduce supply chain concentration risks.",
        },
      ],
      perspective:
        "Enforcing proportional vaccine allocations rectifies the grave distribution inequities witnessed in previous epidemics. However, sustaining regional manufacturing capacity during non-emergency periods requires continuous global procurement subsidies and active clinical trial collaboration.",
    },
  },
  {
    id: "artemis-lunar-polar-mapping",
    title: "Lunar Resource Extraction vs Outer Space Treaty",
    titleHi: "चंद्र संसाधन खनन बनाम बाह्य अंतरिक्ष संधि",
    fallbackTitle: "Lunar Resource Extraction vs Outer Space Treaty",
    url: "https://www.nasa.gov/news-release/artemis-lunar-south-pole-volatile-mapping-milestone-2026/",
    publishedAt: "2026-09-19",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 30,
      explanation: "Technological exploration framing focusing on lunar volatile exploitation and contested property rights under international space law.",
      bias_category: "Space Exploration & International Law",
    },
    analysisResult: {
      cleaned_text:
        "NASA and international partner space agencies released ultra-high-resolution volatile concentration maps of the Moon's South Pole Shackleton Crater rim, identifying extensive subsurface water ice reserves while sparking debate on orbital non-interference zones under the 1967 Outer Space Treaty.",
      sentiment: "Pioneering & Contested",
      score: 90,
      facts: [
        {
          claim: "Spectroscopic surveys verified over 100 million metric tons of extractable water ice in permanently shadowed lunar craters.",
          verified: true,
          sources: ["NASA Artemis Science Directorate Bulletin", "European Space Agency Lunar Exploration Archive"],
          details: "In-situ resource utilization (ISRU) systems could convert water ice into liquid hydrogen and oxygen propellant.",
        },
        {
          claim: "Over 45 nations have signed the Artemis Accords, while non-signatory spacefaring states advocate a new UN space treaty.",
          verified: true,
          sources: ["UN Committee on the Peaceful Uses of Outer Space (COPUOS)", "Secure World Foundation 2026 Briefing"],
          details: "Safety zones around lunar mining operations remain an unresolved legal point regarding national non-appropriation principles.",
        },
      ],
      perspective:
        "Extracting in-situ water ice and oxygen is indispensable for sustainable deep space exploration and human Mars missions. Nonetheless, establishing transparent multilateral governance is crucial to prevent commercial 'land grabs' and ensure the peaceful scientific preservation of unique lunar geological heritage.",
    },
  },
  {
    id: "global-plastics-treaty-inc5",
    title: "Global Plastics Cap vs Petrochemical Supply",
    titleHi: "वैश्विक प्लास्टिक सीमा बनाम पेट्रोकेमिकल आपूर्ति",
    fallbackTitle: "Global Plastics Cap vs Petrochemical Supply",
    url: "https://www.unep.org/news-and-stories/press-release/2026-08-20/intergovernmental-negotiating-committee-plastics-treaty",
    publishedAt: "2026-08-20",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 40,
      explanation: "Environmental regulatory view advocating legally binding virgin plastic production reductions versus industrial recycling investments.",
      bias_category: "Environmental Policy & Circular Economy",
    },
    analysisResult: {
      cleaned_text:
        "The UN Environment Programme (UNEP) INC-5 negotiations entered final sessions, presenting a draft treaty establishing mandatory global caps on primary virgin polymer manufacturing, an elimination list for hazardous chemical additives, and extended producer responsibility criteria.",
      sentiment: "Critical & Urgent",
      score: 87,
      facts: [
        {
          claim: "Annual global virgin plastic production surpassed 460 million metric tons in 2025.",
          verified: true,
          sources: ["UNEP Global Plastics Outlook 2026", "OECD Environmental Directorate"],
          details: "Less than 12% of total manufactured plastics are recycled globally, with remainder incinerated or landfilled.",
        },
        {
          claim: "The draft treaty mandates a 25% reduction in primary polymer output by 2040 against 2024 baselines.",
          verified: true,
          sources: ["UN INC-5 Draft Treaty Text", "High Ambition Coalition Statement"],
          details: "Petrochemical exporting economies advocate focusing on mechanical and chemical recycling infrastructure instead of upstream production caps.",
        },
      ],
      perspective:
        "Capping virgin polymer synthesis directly tackles the pollution crisis at its source and curtails lifecycle greenhouse gas emissions. Transition plans must protect workers in manufacturing regions and subsidize certified bio-benign alternative packaging for developing markets.",
    },
  },
  {
    id: "wto-digital-trade-cross-border-data",
    title: "WTO Digital Trade Accord vs Data Sovereignty",
    titleHi: "विश्व व्यापार संगठन डिजिटल व्यापार समझौता बनाम डेटा संप्रभुता",
    fallbackTitle: "WTO Digital Trade Accord vs Data Sovereignty",
    url: "https://www.wto.org/english/news_e/news26_e/jsec_15sep26_e.htm",
    publishedAt: "2026-09-15",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 33,
      explanation: "Trade liberalization stance supporting unrestricted cross-border data transfer versus national data localization policies.",
      bias_category: "Digital Economy & Trade Governance",
    },
    analysisResult: {
      cleaned_text:
        "The World Trade Organization plurilateral Joint Statement Initiative on Electronic Commerce finalized a global digital trade agreement, establishing binding rules prohibiting customs duties on electronic transmissions and banning forced source-code disclosures while accommodating national privacy exemptions.",
      sentiment: "Analytical / Policy",
      score: 93,
      facts: [
        {
          claim: "The agreement makes permanent the moratorium on customs duties for digital software, media, and electronic transmissions.",
          verified: true,
          sources: ["WTO Plurilateral E-Commerce Agreement Text", "UNCTAD Digital Economy Report 2026"],
          details: "Signatories account for over 85% of total global e-commerce and cross-border digital services flows.",
        },
        {
          claim: "Key developing nations retained policy space for sovereign data localization to nurture domestic cloud infrastructure.",
          verified: true,
          sources: ["Ministry of Commerce & Industry Trade Analysis", "Third World Network Policy Brief"],
          details: "National security and consumer data privacy exceptions remain self-judging within specified criteria.",
        },
      ],
      perspective:
        "Standardizing digital trade disciplines lowers transaction friction for software exports and cross-border fintech services. However, developing nations must maintain sufficient regulatory leeway to protect domestic digital sovereignty, tax digital multinational profits, and foster indigenous cloud ecosystems.",
    },
  },
  {
    id: "smr-nuclear-grid-integration",
    title: "Small Modular Reactors vs Renewable Storage",
    titleHi: "लघु मॉड्यूलर परमाणु रिएक्टर बनाम नवीकरणीय भंडारण",
    fallbackTitle: "Small Modular Reactors vs Renewable Storage",
    url: "https://www.iaea.org/newscenter/pressreleases/iaea-publishes-2026-status-report-small-modular-reactors-grid-power",
    publishedAt: "2026-08-25",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 29,
      explanation: "Energy engineering assessment framing factory-built SMRs as essential clean baseload power versus utility battery storage.",
      bias_category: "Clean Energy Transition & Nuclear Engineering",
    },
    analysisResult: {
      cleaned_text:
        "The International Atomic Energy Agency (IAEA) published its 2026 SMR Deployment Status Report, detailing the grid integration of factory-fabricated Small Modular Reactors across multiple industrial hubs to power AI data centers and heavy manufacturing with carbon-free baseload electricity.",
      sentiment: "Optimistic & Technical",
      score: 92,
      facts: [
        {
          claim: "Modular SMRs achieve power outputs between 50 MWe and 300 MWe with passive cooling safety systems.",
          verified: true,
          sources: ["IAEA Advanced Nuclear Power Technology Report", "World Nuclear Association Market Brief"],
          details: "Factory manufacturing reduces on-site construction timelines from 8 years to approximately 36 months.",
        },
        {
          claim: "Capital expenditure per kilowatt for initial SMR units remains 30% higher than utility-scale solar paired with 8-hour battery storage.",
          verified: true,
          sources: ["BloombergNEF Levelized Cost of Energy 2026", "Lazard Clean Power Benchmark"],
          details: "Series production and standardized licensing are anticipated to reduce levelized costs across subsequent builds.",
        },
      ],
      perspective:
        "SMRs provide uninterrupted, land-efficient zero-carbon power necessary for energy-intensive compute infrastructure and industrial heat. Scaled adoption hinges on establishing standardized international safety licensing and long-term deep geological waste repository agreements.",
    },
  },
  {
    id: "india-semiconductor-micron-commercial",
    title: "India Chip Mission vs Global Foundry Competition",
    titleHi: "भारत सेमीकंडक्टर मिशन बनाम वैश्विक फाउंड्री प्रतिस्पर्धा",
    fallbackTitle: "India Chip Mission vs Global Foundry Competition",
    url: "https://pib.gov.in/PressReleasePage.aspx?PRID=2056781",
    publishedAt: "2026-09-17",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 36,
      explanation: "National industrial strategy highlighting domestic semiconductor manufacturing capacity and supply chain resilience.",
      bias_category: "Industrial Policy & Advanced Technology",
    },
    analysisResult: {
      cleaned_text:
        "The India Semiconductor Mission (ISM 2.0) inaugurated commercial production at the Sanand ATMP semiconductor packaging facility alongside construction progress on commercial 28nm and 40nm fabrication units in Dholera, strengthening domestic supply resilience against global microelectronics disruptions.",
      sentiment: "Strategic & Bullish",
      score: 91,
      facts: [
        {
          claim: "The Indian semiconductor ecosystem has attracted over $18 billion in combined public-private capital commitments.",
          verified: true,
          sources: ["Press Information Bureau (PIB) India", "India Semiconductor Mission Official Status Report"],
          details: "Incentive packages provide 50% central fiscal support on pari-passu basis for approved fab and packaging facilities.",
        },
        {
          claim: "Global advanced logic nodes under 3nm remain concentrated in East Asia and North America.",
          verified: true,
          sources: ["Semiconductor Industry Association (SIA) 2026 Factbook", "Gartner Semiconductor Research"],
          details: "India's near-term strategy focuses on high-volume legacy nodes for automotive, power electronics, and telecommunications.",
        },
      ],
      perspective:
        "Establishing domestic fab and packaging facilities protects critical defense, telecommunications, and automotive industries from geopolitical supply disruptions. Long-term competitiveness requires expanding indigenous semiconductor design talent and establishing localized specialty chemical and ultra-pure gas ecosystems.",
    },
  },
  {
    id: "nist-post-quantum-cryptography-transition",
    title: "Post-Quantum Cryptography vs Cyber Resilience",
    titleHi: "पोस्ट-क्वांटम क्रिप्टोग्राफी बनाम साइबर सुरक्षा लचीलापन",
    fallbackTitle: "Post-Quantum Cryptography vs Cyber Resilience",
    url: "https://www.nist.gov/news-events/news/2026/08/nist-releases-final-post-quantum-encryption-standards-migration-guidelines",
    publishedAt: "2026-08-14",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 20,
      explanation: "Technical standard-setting perspective focusing on algorithmic cryptographic migration to preempt quantum decryption risks.",
      bias_category: "Cybersecurity & Quantum Computing",
    },
    analysisResult: {
      cleaned_text:
        "The National Institute of Standards and Technology (NIST) and global cybersecurity agencies mandated migration deadlines for critical financial and government infrastructure to transition from RSA and Elliptic Curve cryptography to standardized lattice-based post-quantum cryptographic algorithms.",
      sentiment: "Proactive / Urgent",
      score: 96,
      facts: [
        {
          claim: "NIST finalized ML-KEM, ML-DSA, and SLH-DSA as primary post-quantum encryption and digital signature standards.",
          verified: true,
          sources: ["NIST FIPS 203/204/205 Standards", "Cybersecurity and Infrastructure Security Agency (CISA)"],
          details: "The algorithms are designed to withstand attacks from both conventional computers and fault-tolerant quantum systems.",
        },
        {
          claim: "'Harvest Now, Decrypt Later' espionage campaigns target encrypted state and corporate communications for future quantum decryption.",
          verified: true,
          sources: ["ENISA Threat Landscape 2026", "Global Cyber Security Forum Technical Briefing"],
          details: "Legacy encrypted archives remain vulnerable unless re-encrypted or protected by quantum-resistant protocols.",
        },
      ],
      perspective:
        "Proactive migration to quantum-resistant encryption is non-negotiable for safeguarding national security and banking networks before quantum advantage arrives. Organizations must audit complex legacy software stacks and prioritize hybrid key exchanges to avoid performance bottlenecks during the transition.",
    },
  },
  {
    id: "deepfake-watermarking-global-accord",
    title: "AI Watermarking Mandates vs Free Expression",
    titleHi: "एआई वॉटरमार्किंग अनिवार्यता बनाम अभिव्यक्ति स्वतंत्रता",
    fallbackTitle: "AI Watermarking Mandates vs Free Expression",
    url: "https://www.c2pa.org/press/2026-09-10-global-content-provenance-adoption-milestone",
    publishedAt: "2026-09-10",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 34,
      explanation: "Media integrity viewpoint advocating cryptographic provenance metadata across all synthetic audiovisual generations.",
      bias_category: "Digital Ethics & Information Integrity",
    },
    analysisResult: {
      cleaned_text:
        "Major social media platforms and digital camera manufacturers implemented unified C2PA cryptographic provenance standards, automatically attaching tamper-evident metadata and invisible watermarks to synthetic AI imagery and audio to counter political disinformation ahead of major democratic elections.",
      sentiment: "Cautious & Reformative",
      score: 88,
      facts: [
        {
          claim: "Cryptographic C2PA metadata records the origin tool, edit history, and synthetic generation flags of digital media.",
          verified: true,
          sources: ["Coalition for Content Provenance and Authenticity (C2PA)", "World Editors Forum 2026 Report"],
          details: "Over 80% of newly released generative AI media applications embed provenance manifests by default.",
        },
        {
          claim: "Adversarial attacks can strip or alter metadata when media is compressed, screenshotted, or re-encoded across messaging apps.",
          verified: true,
          sources: ["IEEE Transactions on Information Forensics and Security", "Stanford Internet Observatory 2026"],
          details: "Robust imperceptible watermarking is deployed as a secondary fallback layer to resist metadata scrubbing.",
        },
      ],
      perspective:
        "Universal content credentials empower citizens to distinguish between authentic photojournalism and generative synthetic media. However, provenance systems must ensure whistleblower and dissident anonymity so that cryptographic tracing does not become a tool for state surveillance.",
    },
  },
  {
    id: "global-sovereign-debt-climate-resilience",
    title: "Sovereign Debt Relief vs Climate Investment",
    titleHi: "संप्रभु ऋण राहत बनाम जलवायु निवेश आवश्यकताएँ",
    fallbackTitle: "Sovereign Debt Relief vs Climate Investment",
    url: "https://www.imf.org/en/News/Articles/2026/08/29/pr26198-imf-expands-resilience-and-sustainability-facility",
    publishedAt: "2026-08-29",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 31,
      explanation: "Macro-financial development perspective evaluating debt-for-climate swaps against traditional creditor repayment conditionalities.",
      bias_category: "Development Economics & Climate Finance",
    },
    analysisResult: {
      cleaned_text:
        "The International Monetary Fund (IMF) and World Bank expanded the Resilience and Sustainability Trust (RST), incorporating automatic climate-resilience debt pause clauses (CRDCs) and debt-for-nature swap frameworks for emerging economies spending over 20% of government revenue on external debt service.",
      sentiment: "Constructive & Reformist",
      score: 90,
      facts: [
        {
          claim: "Over 40 climate-vulnerable developing nations allocate more public funds to external debt interest than to healthcare and education combined.",
          verified: true,
          sources: ["UNCTAD Sovereign Debt Report 2026", "V20 Climate Vulnerable Forum Finance Ministerial"],
          details: "High interest rates in advanced economies increased debt servicing burdens by 35% between 2023 and 2026.",
        },
        {
          claim: "Climate-resilient debt clauses suspend debt repayments for up to two years following verified natural disaster declarations.",
          verified: true,
          sources: ["World Bank Disaster Risk Financing Facility", "Inter-American Development Bank Bulletin"],
          details: "Suspensions provide immediate fiscal liquidity during emergency reconstruction without triggering credit default ratings.",
        },
      ],
      perspective:
        "Debt-pause clauses and concessional refinancing prevent climate disasters from cascading into sovereign solvency crises. Comprehensive reform requires private bondholders and bilateral creditors to participate in binding debt restructuring rather than shifting liabilities to multilateral development banks.",
    },
  },
  {
    id: "g20-clean-energy-grid-financing",
    title: "Global South Grid Expansion vs Renewable Transition",
    titleHi: "ग्लोबल साउथ ग्रिड विस्तार बनाम नवीकरणीय ऊर्जा संक्रमण",
    fallbackTitle: "Global South Grid Expansion vs Renewable Transition",
    url: "https://www.irena.org/News/pressreleases/2026/Sep/IRENA-G20-Report-Urges-Trillion-Dollar-Grid-Upgrade",
    publishedAt: "2026-09-08",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 27,
      explanation: "Energy policy analysis advocating for high-voltage transmission infrastructure investment over generation-only subsidies.",
      bias_category: "Energy Infrastructure & Sustainable Development",
    },
    analysisResult: {
      cleaned_text:
        "The International Renewable Energy Agency (IRENA) and G20 Energy Transitions Working Group published joint findings revealing that inadequate high-voltage transmission grids and grid-scale storage—rather than generation capacity—have become the primary bottleneck to tripling global renewable energy by 2030.",
      sentiment: "Strategic & Urgent",
      score: 93,
      facts: [
        {
          claim: "Over 3,000 gigawatts of completed renewable energy projects worldwide await electrical grid connection queues.",
          verified: true,
          sources: ["IRENA World Energy Transitions Outlook 2026", "International Energy Agency (IEA) Grid Report"],
          details: "Developing regions in Asia, Africa, and Latin America face the largest transmission capital expenditure deficits.",
        },
        {
          claim: "Global annual grid investment must double to $600 billion annually by 2030 to prevent renewable power curtailment.",
          verified: true,
          sources: ["G20 Energy Transitions Ministerial Communiqué", "World Bank Energy Sector Management Assistance Program"],
          details: "Cross-border HVDC interconnectors and smart distribution grids require blended multilateral concessional finance.",
        },
      ],
      perspective:
        "Expanding transmission grids is the foundational backbone of decarbonization, without which renewable investments suffer costly curtailment. Multilateral financial institutions must shift focus from subsidizing individual solar farms to co-financing regional smart grid infrastructure.",
    },
  },
  {
    id: "autonomous-vehicle-safety-regulations",
    title: "Autonomous Fleet Deployment vs Public Safety",
    titleHi: "स्वायत्त वाहन बेड़ा परिचालन बनाम सार्वजनिक सुरक्षा",
    fallbackTitle: "Autonomous Fleet Deployment vs Public Safety",
    url: "https://www.nhtsa.gov/press-releases/nhtsa-issues-federal-safety-framework-autonomous-commercial-fleets-2026",
    publishedAt: "2026-08-18",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 37,
      explanation: "Transportation regulatory view balancing commercial robotaxi rollout with mandatory telemetry logging and pedestrian safety benchmarks.",
      bias_category: "Transportation & Autonomous Systems",
    },
    analysisResult: {
      cleaned_text:
        "The National Highway Traffic Safety Administration (NHTSA) enacted the 2026 Federal Safety Framework for Commercial Autonomous Vehicles, requiring robotaxi operators to share standardized disengagement telematics, emergency responder protocols, and open incident data before expanding commercial operations.",
      sentiment: "Cautious & Pragmatic",
      score: 89,
      facts: [
        {
          claim: "Autonomous vehicle commercial fleets operated over 50 million commercial passenger miles across metropolitan areas in 2026.",
          verified: true,
          sources: ["NHTSA Autonomous Fleet Data Repository", "California DMV AV Testing Reports"],
          details: "Overall collision rates per million miles were 40% lower than human drivers, though low-speed urban navigation anomalies persisted.",
        },
        {
          claim: "New federal rules require AVs to automatically yield to emergency vehicles and maintain remote human-fallback oversight.",
          verified: true,
          sources: ["Federal Motor Vehicle Safety Standards Update", "National Transportation Safety Board (NTSB)"],
          details: "Mandatory emergency routing protocols were enacted after municipal fire department blockage complaints.",
        },
      ],
      perspective:
        "Autonomous fleets offer transformative potential to eliminate driver fatigue, reduce fatal collisions, and enhance urban mobility. Realizing these benefits demands uniform federal safety benchmarks, transparent crash data disclosure, and fair transition programs for professional transit workers.",
    },
  },
  {
    id: "space-debris-active-removal-accord",
    title: "Orbital Space Debris vs Mega-Constellations",
    titleHi: "अंतरिक्ष कचरा प्रबंधन बनाम उपग्रह मेगा-कॉन्स्टेलेशन",
    fallbackTitle: "Orbital Space Debris vs Mega-Constellations",
    url: "https://www.esa.int/Space_Safety/Clean_Space/Zero_Debris_Charter_Implementation_2026",
    publishedAt: "2026-09-05",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 26,
      explanation: "Astrodynamics and orbital sustainability view addressing Kessler Syndrome risks from low-Earth orbit satellite proliferation.",
      bias_category: "Space Sustainability & Astrophysics",
    },
    analysisResult: {
      cleaned_text:
        "The European Space Agency (ESA) and international space agencies commenced operational phases of the Zero Debris Charter, mandating active de-orbiting mechanisms for all satellites launched after 2026 and funding the first commercial active debris capture mission targeting spent rocket upper stages.",
      sentiment: "Preventative & Scientific",
      score: 94,
      facts: [
        {
          claim: "More than 36,000 tracked debris objects larger than 10 centimeters currently orbit Earth in Low Earth Orbit (LEO).",
          verified: true,
          sources: ["ESA Space Debris Office 2026 Report", "US Space Command Orbital Data Tracker"],
          details: "Orbital collision avoidance maneuvers by commercial constellations increased by 150% compared to 2024.",
        },
        {
          claim: "The Zero Debris Charter requires satellites in LEO to de-orbit within 5 years of mission completion, down from 25 years.",
          verified: true,
          sources: ["Inter-Agency Space Debris Coordination Committee (IADC)", "NASA Orbital Debris Program"],
          details: "Compliance requires satellites to reserve propellant or deploy passive drag sails for controlled atmospheric re-entry.",
        },
      ],
      perspective:
        "Preserving access to low-Earth orbit is vital for global communications, weather forecasting, and environmental earth observation. Enforcing strict post-mission disposal rules and subsidizing active debris removal is imperative to avoid irreversible cascade collisions.",
    },
  },
  {
    id: "gene-drive-agricultural-governance",
    title: "Gene Drive Technology vs Ecosystem Ethics",
    titleHi: "जीन ड्राइव तकनीक बनाम पारिस्थितिक नैतिकता",
    fallbackTitle: "Gene Drive Technology vs Ecosystem Ethics",
    url: "https://www.cbd.int/doc/press/2026/pr-synthetic-biology-risk-assessment-cop17-prep.pdf",
    publishedAt: "2026-08-22",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 41,
      explanation: "Bioethics and biodiversity conservation perspective assessing irreversible environmental genetic alterations against vector-borne disease eradication.",
      bias_category: "Biotechnology & Ecological Governance",
    },
    analysisResult: {
      cleaned_text:
        "The Convention on Biological Diversity (CBD) Synthetic Biology Ad Hoc Technical Expert Group released updated risk assessment protocols for engineered gene drives, balancing the potential eradication of malaria-transmitting mosquitoes and invasive agricultural pests against risks of irreversible cross-species genetic drift.",
      sentiment: "Cautious / Deliberative",
      score: 88,
      facts: [
        {
          claim: "CRISPR-based synthetic gene drives achieve over 95% inheritance inheritance rates in target insect populations.",
          verified: true,
          sources: ["Target Malaria Scientific Consortium", "Nature Biotechnology 2026 Field Assessment"],
          details: "Contained trial releases demonstrated localized Anopheles mosquito population suppression without immediate ecosystem collapse.",
        },
        {
          claim: "Over 100 civil society organizations and indigenous groups petition for mandatory free, prior, and informed consent before open-air releases.",
          verified: true,
          sources: ["CBD COP17 Working Group Submissions", "International Union for Conservation of Nature (IUCN)"],
          details: "Concerns center on cross-border dispersal and the absence of proven gene-drive recall mechanisms in open wilderness.",
        },
      ],
      perspective:
        "Gene drive engineering presents an unprecedented opportunity to eliminate vector-borne afflictions that claim hundreds of thousands of lives annually. Open releases must be conditioned on multistakeholder consent, reversible gene-switch fail-safes, and international regulatory oversight.",
    },
  },
  {
    id: "critical-minerals-supply-chain-alliance",
    title: "Critical Minerals Security vs Refining Standards",
    titleHi: "महत्वपूर्ण खनिज सुरक्षा बनाम शोधन एवं पर्यावरण मानक",
    fallbackTitle: "Critical Minerals Security vs Refining Standards",
    url: "https://www.iea.org/news/iea-launches-critical-minerals-transparency-hub-2026",
    publishedAt: "2026-09-12",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 30,
      explanation: "Supply chain resilience analysis evaluating localized mineral processing diversification against environmental and water impact standards.",
      bias_category: "Geoeconomics & Mineral Resources",
    },
    analysisResult: {
      cleaned_text:
        "The International Energy Agency (IEA) launched the Critical Minerals Transparency Hub, documenting global diversification in lithium, nickel, and rare-earth refining while establishing environmental, social, and governance (ESG) benchmarks to eliminate child labor and reduce sulfuric water contamination in processing hubs.",
      sentiment: "Analytical & Rigorous",
      score: 91,
      facts: [
        {
          claim: "Over 65% of global rare-earth refining and 70% of battery-grade lithium processing remain geographically concentrated in single markets.",
          verified: true,
          sources: ["IEA Critical Minerals Market Review 2026", "US Geological Survey (USGS) Mineral Summaries"],
          details: "Concentrated processing nodes create vulnerability to export controls and logistics disruptions.",
        },
        {
          claim: "Direct Lithium Extraction (DLE) technologies reduce water consumption by up to 85% compared to conventional evaporation ponds.",
          verified: true,
          sources: ["Department of Energy Clean Energy Tech Bulletin", "Chilean National Lithium Commission"],
          details: "Commercial DLE installations in South America and North America achieved commercial operational yields in 2026.",
        },
      ],
      perspective:
        "Diversifying critical mineral extraction and refining is essential to prevent geopolitical supply shocks from stalling the clean energy transition. Diversification must adhere to stringent environmental and labor standards rather than exporting ecological degradation to mining communities.",
    },
  },
  {
    id: "universal-basic-services-ai-displacement",
    title: "Universal Basic Services vs Direct Cash Transfers",
    titleHi: "सार्वभौमिक बुनियादी सेवाएँ बनाम प्रत्यक्ष नकद हस्तांतरण",
    fallbackTitle: "Universal Basic Services vs Direct Cash Transfers",
    url: "https://www.oecd.org/employment/future-of-work/universal-basic-services-ai-transition-2026.htm",
    publishedAt: "2026-08-16",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 32,
      explanation: "Social policy debate comparing state-provided public goods (healthcare, transit, broadband) against unconditional basic income cash payouts.",
      bias_category: "Labor Economics & Social Welfare",
    },
    analysisResult: {
      cleaned_text:
        "The OECD Social Welfare Policy Forum published comparative trial evaluations across 12 countries, assessing Universal Basic Services (UBS)—guaranteed access to public housing, healthcare, transit, and high-speed fiber—against Universal Basic Income (UBI) cash transfers in communities facing accelerated AI clerical displacement.",
      sentiment: "Comparative / Policy",
      score: 92,
      facts: [
        {
          claim: "UBS public goods provision reduced baseline household cost-of-living volatility by 42% compared to cash-only pilots.",
          verified: true,
          sources: ["OECD Employment and Migration Papers", "Institute for Public Policy Research (IPPR) 2026"],
          details: "Direct access to municipal childcare and subsidized fiber networks showed higher long-term labor re-entry rates.",
        },
        {
          claim: "Cash transfer recipients demonstrated higher immediate autonomy in funding personalized credentialing and debt repayment.",
          verified: true,
          sources: ["National Bureau of Economic Research (NBER) Working Paper", "Stanford Basic Income Lab 2026"],
          details: "Direct cash demonstrated lower administrative overhead compared to managing municipal public services.",
        },
      ],
      perspective:
        "As automation disrupts mid-level knowledge professions, social safety nets must evolve beyond traditional unemployment insurance. A hybrid model combining targeted cash assistance with decommodified essential public services offers the strongest buffer against structural inequality.",
    },
  },
  {
    id: "global-biodiversity-framework-30x30-progress",
    title: "Kunming-Montreal 30x30 Target vs Indigenous Rights",
    titleHi: "कुनमिंग-मॉन्ट्रियल 30x30 लक्ष्य बनाम स्वदेशी अधिकार",
    fallbackTitle: "Kunming-Montreal 30x30 Target vs Indigenous Rights",
    url: "https://www.cbd.int/article/2026-midterm-assessment-kunming-montreal-framework",
    publishedAt: "2026-09-04",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 24,
      explanation: "Conservation science and human rights view examining the enforcement of protected area expansion against indigenous land tenure rights.",
      bias_category: "Biodiversity Conservation & Human Rights",
    },
    analysisResult: {
      cleaned_text:
        "The UN Biodiversity Midterm Review assessed progress on Target 3 of the Kunming-Montreal Global Biodiversity Framework (protecting 30% of land and oceans by 2030), warning that protected area expansion risks human rights violations without formal legal recognition of Indigenous and community land stewardship.",
      sentiment: "Empathetic & Fact-Based",
      score: 95,
      facts: [
        {
          claim: "Currently, 17.8% of terrestrial land and 9.1% of marine areas are designated under official protected status.",
          verified: true,
          sources: ["UNEP-WCMC Protected Planet Report 2026", "IUCN World Conservation Congress Records"],
          details: "Designations must nearly double within four years to meet the international 30% target by 2030.",
        },
        {
          claim: "Lands stewarded by Indigenous peoples contain 80% of remaining global biodiversity despite covering only 22% of land area.",
          verified: true,
          sources: ["IPBES Global Assessment Report", "Rights and Resources Initiative (RRI) 2026 Study"],
          details: "Community-managed territories exhibit deforestation rates up to 50% lower than state-run national parks.",
        },
      ],
      perspective:
        "Preserving 30% of global ecosystems is paramount to halt mass extinction and maintain carbon sinks. Conservation must reject exclusionary fortress conservation models and place indigenous land rights and customary ownership at the center of conservation policy.",
    },
  },
  {
    id: "cbdc-cross-border-interoperability",
    title: "Central Bank Digital Currencies vs Financial Privacy",
    titleHi: "केंद्रीय बैंक डिजिटल मुद्राएँ बनाम वित्तीय गोपनीयता",
    fallbackTitle: "Central Bank Digital Currencies vs Financial Privacy",
    url: "https://www.bis.org/press/p260819.htm",
    publishedAt: "2026-08-19",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 39,
      explanation: "Central banking perspective emphasizing instantaneous payment settlement and fraud prevention versus civil privacy concerns over programmable money.",
      bias_category: "Financial Technology & Monetary Economics",
    },
    analysisResult: {
      cleaned_text:
        "The Bank for International Settlements (BIS) and seven central banks successfully concluded Project Agora Phase II, demonstrating instantaneous cross-border wholesale CBDC settlement via unified ledgers while initiating debates on zero-knowledge encryption protocols to protect retail user privacy.",
      sentiment: "Technical / Debative",
      score: 90,
      facts: [
        {
          claim: "Wholesale CBDC cross-border settlement reduced international correspondent banking latency from 3 days to under 10 seconds.",
          verified: true,
          sources: ["BIS Innovation Hub Project Agora Report", "SWIFT Global Payments Innovation 2026"],
          details: "Eliminating intermediary correspondent tiers lowered cross-border transaction fees by over 60%.",
        },
        {
          claim: "Civil liberties organizations demand statutory zero-knowledge cryptographic safeguards against state transaction tracking in retail CBDCs.",
          verified: true,
          sources: ["Electronic Frontier Foundation (EFF) Financial Privacy Review", "European Central Bank Digital Euro Governance Board"],
          details: "Tiered anonymity limits allow untracked small-value peer-to-peer retail payments while applying AML controls on large transfers.",
        },
      ],
      perspective:
        "Interoperable CBDCs modernize legacy cross-border payment friction and lower remittance costs for migrant workers globally. However, public trust demands strict legislative barriers against programmable spending restrictions and cryptographic guarantees of cash-like transactional privacy.",
    },
  },
  {
    id: "deep-sea-mining-environmental-regulations",
    title: "Deep-Sea Mining Moratorium vs Mineral Demand",
    titleHi: "गहरे समुद्र में खनन स्थगन बनाम खनिज आवश्यकताएँ",
    fallbackTitle: "Deep-Sea Mining Moratorium vs Mineral Demand",
    url: "https://www.isa.org.jm/news/assembly-concludes-deliberations-on-exploitation-code-for-deep-seabed-minerals-2026",
    publishedAt: "2026-08-15",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 35,
      explanation: "Oceanographic marine conservation perspective advocating precautionary pauses against industrial mining consortia seeking polymetallic nodules.",
      bias_category: "Ocean Governance & Marine Ecology",
    },
    analysisResult: {
      cleaned_text:
        "The International Seabed Authority (ISA) Assembly concluded negotiations in Kingston without issuing commercial exploitation permits, as a growing coalition of 32 member states affirmed support for a precautionary pause on polymetallic nodule extraction in the Clarion-Clipperton Zone.",
      sentiment: "Precautionary & Tense",
      score: 91,
      facts: [
        {
          claim: "Abyssal nodule fields contain millions of tons of nickel, cobalt, and copper needed for electric vehicle batteries.",
          verified: true,
          sources: ["ISA Technical and Legal Commission Report", "US Geological Survey Marine Geology Review"],
          details: "Mining companies argue seabed extraction produces lower carbon emissions and zero terrestrial waste compared to land mines.",
        },
        {
          claim: "Marine biological surveys identified over 5,000 unique, unnamed deep-sea species in prospective mining areas.",
          verified: true,
          sources: ["Deep-Sea Conservation Coalition (DSCC)", "Current Biology 2026 Ecological Survey"],
          details: "Sediment plumes and acoustic disturbances can disrupt benthic ecosystems that require centuries to recover.",
        },
      ],
      perspective:
        "While seabed nodules contain immense quantities of critical battery minerals, harvesting them before benthic ecosystems and carbon sequestration functions are understood poses severe ecological risks. Battery chemistry innovations using sodium-ion and LFP should be prioritized over destroying unmapped ocean habitats.",
    },
  },
  {
    id: "cross-border-telemedicine-ai-diagnostics",
    title: "Cross-Border AI Healthcare vs Medical Licensing",
    titleHi: "सीमा पार एआई स्वास्थ्य सेवा बनाम चिकित्सा लाइसेंसिंग",
    fallbackTitle: "Cross-Border AI Healthcare vs Medical Licensing",
    url: "https://www.who.int/news/item/2026-09-02-who-releases-global-standards-for-clinical-ai-diagnostics",
    publishedAt: "2026-09-02",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 28,
      explanation: "Global health equity perspective advocating cross-border AI diagnostic telemedicine to alleviate severe specialist doctor shortages.",
      bias_category: "Healthcare Technology & Medical Regulation",
    },
    analysisResult: {
      cleaned_text:
        "The World Health Organization and International Telecommunication Union published global certification criteria for clinical diagnostic AI tools, enabling qualified autonomous radiological and retinal screening tools to operate across national healthcare systems in medically underserved regions.",
      sentiment: "Progressive & Cautionary",
      score: 94,
      facts: [
        {
          claim: "AI diagnostic systems demonstrated 96% diagnostic accuracy in detecting diabetic retinopathy and early oncology lesions in multi-country validation trials.",
          verified: true,
          sources: ["WHO Digital Health Technical Report", "The Lancet Digital Health 2026 Validation Study"],
          details: "Algorithm performance was benchmarked across diverse demographic and skin pigmentation datasets.",
        },
        {
          claim: "National medical licensing bodies raise jurisdictional liability concerns regarding automated medical malpractice attribution.",
          verified: true,
          sources: ["World Medical Association (WMA) Policy Statement", "American College of Radiology Bulletin"],
          details: "Regulatory frameworks currently mandate human clinician-in-the-loop sign-off for invasive therapeutic prescriptions.",
        },
      ],
      perspective:
        "Deploying verified clinical AI tools can bring world-class specialist screening to remote clinics lacking resident radiologists and oncologists. Safe implementation requires strict calibration on local disease profiles and clear statutory legal liability assigned to deploying institutions.",
    },
  },
  {
    id: "satellite-internet-spectrum-mega-constellations",
    title: "Satellite Internet Megaconstellations vs Astronomy",
    titleHi: "उपग्रह इंटरनेट मेगा-कॉन्स्टेलेशन बनाम खगोलीय अवलोकन",
    fallbackTitle: "Satellite Internet Megaconstellations vs Astronomy",
    url: "https://www.itu.int/en/mediacentre/Pages/PR-2026-09-07-WRC-Spectrum-Space-Astronomy-Protection.aspx",
    publishedAt: "2026-09-07",
    curatedAt: "2026-09-25",
    biasScore: {
      bias_score: 30,
      explanation: "Astronomical observation and telecommunications view balancing global rural broadband connectivity against optical and radio sky interference.",
      bias_category: "Telecommunications & Space Sciences",
    },
    analysisResult: {
      cleaned_text:
        "The International Telecommunication Union (ITU) World Radiocommunication Advisory Group implemented revised spectrum allocations and optical reflectivity caps for low-Earth orbit broadband satellite constellations to protect optical and radio astronomy observatories while guaranteeing rural broadband coverage.",
      sentiment: "Balanced & Technical",
      score: 93,
      facts: [
        {
          claim: "Over 14,000 active broadband satellites currently orbit Earth, delivering high-speed internet to 12 million remote and maritime users.",
          verified: true,
          sources: ["ITU Satellite Communications Registry", "Euroconsult Space Economy Report 2026"],
          details: "Broadband constellations provide vital educational and emergency connectivity in remote regions without cellular towers.",
        },
        {
          claim: "Satellite photobombing and radio frequency leakage affect up to 25% of deep-space optical telescope survey exposures.",
          verified: true,
          sources: ["International Astronomical Union (IAU) Dark Skies Center", "Vera C. Rubin Observatory Technical Bulletin"],
          details: "New regulations require dielectric mirror coatings and dynamic radio beam-steering away from observatory zones.",
        },
      ],
      perspective:
        "High-speed satellite connectivity is an indispensable tool for closing the digital divide in rural, island, and disaster-prone communities. Satellite operators and international astronomers must collaborate on hardware redesigns, dark coatings, and coordinated scheduling to preserve humanity's clear view of the cosmos.",
    },
  },
];
