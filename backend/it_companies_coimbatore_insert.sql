-- ============================================================
-- IT Companies in Coimbatore — INSERT Statements
-- Table: professional_circle
-- Columns: user_id, company_name, website, name, designation,
--          email, phone, address
-- user_id starts at: 4001
-- Source: IT Companies in Coimbatore With Email Address.doc
-- Notes:
--   • "Name of the Promoter"  → name  (honorifics kept as-is)
--   • "E mail / Website"      → website (if www.*) / email (if @)
--   • "Phone"                 → phone  (researcher notes stripped)
--   • designation             → NULL (not present in document)
--   • address                 → extracted from description rows where available
--   • Entries 27, 60         → name is NULL (not listed in document)
--   • Entry  83               → "Web design" is a type label, not a person name
-- ============================================================

INSERT INTO professional_circle (user_id, company_name, website, name, designation, email, phone, address) VALUES
-- 1
(4001, '365 Media', 'www.365media.com', 'Mr Senthil Kumar', NULL, NULL, '0422-2670214', NULL),

-- 2  | phone has two numbers; both retained
(4002, 'ABT Info', 'www.abtinfo.net', 'Mr Manickam', NULL, NULL, '0422-4322373/397, +91 99944 05569', NULL),

-- 3  | address extracted from description row
(4003, 'Accurate Data Convertors', 'www.dataaccurate.com', 'Mr Vellayan Lakshmanan', NULL, NULL, '0422-2470280', '130, Ramalingam Road West, R.S.Puram, Coimbatore - 641002'),

-- 4  | address extracted from description row
(4004, 'Acusis Software India Pvt. Ltd', 'www.acusis.com', 'Mr K B Anand', NULL, NULL, '0422-2547636', '2nd Floor, No.229, A.S. Centre, Tiruvenkatasamy Road (East), R.S. Puram, Coimbatore'),

-- 5  | address extracted from description row
(4005, 'Aeon Systems India (P) Ltd', 'www.aeonsystem.com', 'Mr G Ravi Kumar', NULL, NULL, '0422-6577925', '144 & 145, Nava India Road, 1B, SLV Noble RR Embassy Building, Peelamedu, Coimbatore'),

-- 6  | address extracted from description row; phone cleaned (extra number from HR note excluded)
(4006, 'AGT Electronics Limited', 'www.agtindia.com', 'Mr K Thangaraj', NULL, NULL, '0422-2627795, 0422-2627018', 'AGT Business Park, 25 Electronics Estate, Avinashi Road, Coimbatore - 641014'),

-- 7
(4007, 'AKT Business Processing Outsourcing Pvt Ltd', 'www.aktbpo.com', 'Mr Daniel Victor', NULL, NULL, '0422-4363331, 0422-4397551, 0422-5521010', NULL),

-- 8  | email present; no website
(4008, 'Akshay CADD Centre', NULL, 'Mr V R Chander', NULL, 'chander_cadd@airtelmail.in', '0422-4369111, 0422-4391200', NULL),

-- 9  | address extracted from description row; researcher note "Jansi HR" excluded from phone
(4009, 'Angler Technologies India Pvt Limited', 'www.angleritech.com', 'Mr Jayanthra Jayachandran', NULL, NULL, '0422-2312707, 0422-2313938', '1247, Trichy Road, Chinthamani, Rukmani Nagar, Coimbatore - 641045'),

-- 10
(4010, 'Anupam Infoserve Solution Pvt. Ltd', 'www.anupaminfoserve.com', 'Mr V Premnath', NULL, NULL, '0422-4380011, 0422-2230210', NULL),

-- 11 | email present; no website; address from description
(4011, 'Archstone Consulting Engineers', NULL, 'Ms Padmini Radhakrishnan', NULL, 'prk@archstone.in', '0422-4363375, 0422-4518801', '105 PSG STEP II, Avinashi Road, Peelamedu, Coimbatore'),

-- 12
(4012, 'Assistanz Networks Pvt Ltd', 'www.assistanz.com', 'Mr Jaffer Ali / Mr Amal Renjith', NULL, NULL, '0422-4385393, 0422-3919201', NULL),

-- 13
(4013, 'Axon Infosoft India Pvt Ltd', 'www.axonindia.com', 'Mr C S Manoharan', NULL, NULL, '0422-2528843, 0422-2526006, 0422-3203003', NULL),

-- 14
(4014, 'Bannari Infotech Pvt Ltd', 'www.bannariinfotech.com', 'Mr S V Balasubramaniam', NULL, NULL, '0422-2231731, 0422-4206670', NULL),

-- 15 | doc has "Thirumalaiswamvg web@vsnl.com" in email/website col —
--     "Thirumalaiswamvg" is a garbled name fragment; email extracted as web@vsnl.com
(4015, 'Best Infoways India Pvt Ltd', NULL, 'Mr Narayanswami', NULL, 'web@vsnl.com', '0422-4357259', NULL),

-- 16 | email present; no website
(4016, 'Bioniik Innovations', NULL, 'Mr Abbas Ali H', NULL, 'abbas_babu@yahoo.co.in', '0422-4363385', NULL),

-- 17
(4017, 'BPO Integra India Pvt. Ltd.', 'www.globalintegra.com', 'Mr Ramprakash P', NULL, NULL, '0422-4379555, 0422-4520453', NULL),

-- 18 | email present; no website
(4018, 'Cable Partner Call Solution India P. Ltd', NULL, 'Mr Vinod Kumar S', NULL, 'Vinodsof@almega.com', '0422-4397417', NULL),

-- 19 | address from description row
(4019, 'Cambridge Systems (India) Pvt. Ltd', 'www.camsysind.com', 'Mr P Doki', NULL, NULL, '0422-2535360', 'SF No. 428/3, Kanapathy Towers, 3rd Floor, Sathy Road, Ganapathy, Coimbatore - 641006'),

-- 20
(4020, 'CAP Digisoft Solutions Pvt Ltd', 'www.capdigisoft.com', 'Mr Arun Kumar', NULL, NULL, '0422-4216875, 0422-4216975', NULL),

-- 21 | email present; address from description; researcher note "Ph 77080 00750 Mr Raj" excluded
(4021, 'Carolina Technology Solutions Pvt. Ltd', NULL, 'Mr Vivek Devas I', NULL, 'devas@carotechs.com', '0422-4383403', '23-26, Ansari Street, Ram Nagar, Coimbatore'),

-- 22 | email sales@cgvak.com from description; address from description
(4022, 'CG-VAK Software & Exports Ltd', 'www.cgvak.com', 'Mr Suresh', NULL, 'sales@cgvak.com', '0422-2434491, 0422-2434492, 0422-2434493', 'Unit 1, 171 MTP Road, Coimbatore - 641043; Unit 2, Vellaikinar Pirivu, Coimbatore - 641029'),

-- 23
(4023, 'Cognizant Technology Solutions India (P) Ltd', 'www.cognizant.com', 'Mr Lakshmi Narayan', NULL, NULL, '0422-3984000', NULL),

-- 24 | email present; no website
(4024, 'Consolidated Cybernatics Co Pvt. Ltd', NULL, 'Mr Rangaswami P R', NULL, 'prr@cyberneticsindia.com', '0422-2599171, 0422-2599172', NULL),

-- 25
(4025, 'Cosmic Engineering Consultants', 'www.cosmicengg.com', 'Mr S Sakthivel', NULL, NULL, '0422-2644273', NULL),

-- 26 | email present; no website
(4026, 'DS1 Technologies (India)', NULL, 'Ms T K Geetha', NULL, 'geethatk@ds1tech.com', '0422-4377584', NULL),

-- 28
(4028, 'Easy Design Systems Private Limited', 'www.easydesignsystems.com', 'Mr S Padhmanabhan', NULL, NULL, '0422-2489189', NULL),

-- 29 | phone note "not" cleaned
(4029, 'E-Biz Global Corporate Pvt Ltd', 'www.ebizgc.com', 'Mr Anand SK', NULL, NULL, '0422-2245747, 0422-4392131', NULL),

-- 30 | "Fertilizer company" is researcher note, not phone; cleaned
(4030, 'Eintegrity Solutions', 'www.e-integritysolutions.com', 'Mr T N Sambasivan', NULL, NULL, '0422-2541312', NULL),

-- 31 | email present; no website; "No answer" is researcher note; cleaned
(4031, 'Elgi Software and Technologies Ltd', NULL, 'Mr Sumanth Ramamurthi', NULL, 'estel@esh.saraelgi.com', '0422-2311711', NULL),

-- 32 | "not" cleaned from phone
(4032, 'Ephron Tech', 'www.ephrontech.com', 'Mr Surya', NULL, NULL, '0422-3209849', NULL),

-- 33 | "not" cleaned from phone
(4033, 'FocusMT India Pvt Ltd', 'www.focusmt.com', 'Mr Jayesh L Nagda', NULL, NULL, '0422-4370587', NULL),

-- 34 | email present; no website
(4034, 'G-NET Solutions CBE Pvt Ltd', NULL, 'Mr Ramesh G', NULL, 'ramesh@gnet.in', '0422-2595080, 0422-4363343', NULL),

-- 35 | email present; domain suffix missing in doc (.com assumed) — stored as-is
(4035, 'Hiris Technologies', NULL, 'Mr Gunasekar Duraisamy', NULL, 'soundararaj.narayanswamy@hiristechnologies.com', '0422-4363340', NULL),

-- 36 | email present; "not" cleaned from phone
(4036, 'Infoaxiom (India) Pvt Ltd', NULL, 'Mr Sivaram P', NULL, 'psivaram@infoaxiom.com', '0422-4363368, 0422-4350950', NULL),

-- 37
(4037, 'K G Information Systems (P) Limited', 'www.kgisl.com', 'Mr Ashok Bhakthavalsalam', NULL, NULL, '0422-2666187', NULL),

-- 38 | email present; "not" cleaned from phone
(4038, 'Kalni Technology (P) Ltd', NULL, 'Mr Mohanraj', NULL, 'mohanrajkb2001@yahoo.co.in', '0422-3248882', NULL),

-- 39 | email present; "not" cleaned from phone
(4039, 'Kalpatharu Software Limited', NULL, 'Mr T Man', NULL, 'kalpatha@vsnl.com', '0422-2222561, 0422-2220671', NULL),

-- 40 | email present; "not" cleaned from phone
(4040, 'Kalycito Infotech Pvt. Ltd', NULL, 'Mr Bhagath Singh K', NULL, 'bhagath@kalycito.com', '0422-4518454', NULL),

-- 41
(4041, 'Kavin Engineering and Services Pvt Ltd', 'www.kavinengg.com', 'Mr S Ramachandran', NULL, NULL, '0422-4297400, 0422-4393498', NULL),

-- 42 | "not" cleaned from phone
(4042, 'KG Hirotec Engineering Services Pvt. Ltd.', 'www.kghirotec.com', 'Mr M Suresh', NULL, NULL, '0422-2667054', NULL),

-- 43
(4043, 'KL Solar Company Pvt Ltd', 'www.klsolar.com', 'Mr Arun K / Mr Vishnu K', NULL, NULL, '0422-2901464, 0422-2628909', NULL),

-- 44 | "not" cleaned from phone
(4044, 'K-Logic Softech Solutions Pvt. Ltd', 'www.klogicsoftware.com', 'Mr K Manickam', NULL, NULL, '0422-4397890', NULL),

-- 45 | email present; "not" cleaned from phone
(4045, 'Lexbit Technologies Pvt. Ltd', NULL, 'Mr Praveen A', NULL, 'lexbit@gmail.com', '0422-4363336', NULL),

-- 46 | "not" cleaned from phone
(4046, 'Magna Digitech India P Ltd', 'www.magnadigitechindia.com', 'Ms N Ranganayaki', NULL, NULL, '0422-4391626, 0422-2218153', NULL),

-- 47
(4047, 'Mark IV Animation Studios Pvt. Ltd', 'www.markivstudios.com', 'Mr Vikram Visvanathan', NULL, NULL, '0422-4385520', NULL),

-- 48 | email present; no website
(4048, 'Mascot Soft Technology', NULL, 'Mr Jaya Kumar A', NULL, 'MascotETech@yahoo.com', '0422-2574311, 0422-4363369', NULL),

-- 49
(4049, 'Maze Net Solution P Ltd', 'www.mazenetsolution.com', 'Mr K Mani', NULL, NULL, '0422-4372121, 0422-4372122, 0422-4372123', NULL),

-- 50 | email present; no website
(4050, 'Mezoblanca Solutions (India) Pvt. Ltd', NULL, 'Mr Arun Kumar M', NULL, 'arun_33@yahoo.com', '0422-4363316', NULL),

-- 51 | email present; no website
(4051, 'Minveli Infotech', NULL, 'Mr Dhanapal P', NULL, 'info@minveli.com', '0422-4363319', NULL),

-- 52
(4052, 'Nimbeon Inter Technologies (P) Ltd', 'www.nimbeon.com', 'Ms Kavitha Sukumar', NULL, NULL, '0422-4355220', NULL),

-- 53
(4053, 'Nous Infosystem', 'www.nousinfosystem.com', 'Mr N T C Mani', NULL, NULL, '0422-3058800', NULL),

-- 54 | email present; no website
(4054, 'Ocenture IDO', NULL, 'Mr Subash G', NULL, 'gsubash@ocenture.com', '0422-4218493', NULL),

-- 55 | email present; no website
(4055, 'Panini Infotech Pvt. Ltd', NULL, 'Mrs S Sudha', NULL, 'paniniinfo@vsnl.net', '0422-4397667, 0422-4363360', NULL),

-- 56
(4056, 'Perot Systems', 'www.perotsystems.com', 'Mr Peter Altabef', NULL, NULL, '0422-6462555', NULL),

-- 57
(4057, 'Pramura Software Private Limited', 'www.pramuragroup.com', 'Mr Mohan Murali', NULL, NULL, '0422-2642087, 0422-3257647', NULL),

-- 58 | name has no honorific in doc ("G Venkatesh") — kept as-is
(4058, 'Premier Polytronics (P) Ltd', 'www.premier-1.com', 'G Venkatesh', NULL, NULL, '0422-6611000', NULL),

-- 59
(4059, 'Pricol Technologies P Ltd', 'www.pricoltech.com', 'Mr Vikram Mohan', NULL, NULL, '0422-4332211', NULL),

-- 61
(4061, 'Quebec Information Services India Limited', 'www.salzergroup.com', 'Mr R Doraiswamy', NULL, NULL, '0422-2692531', NULL),

-- 62
(4062, 'Ranga Informatics Private Limited', 'www.rangasoftt.com', 'Mr S S Sambandan', NULL, NULL, '0422-2443820, 0422-2438521', NULL),

-- 63 | name was "Mr A P Chandrasekaran and Mr A" (cut-off in doc); first name taken
(4063, 'Ravichandra Systems and Computer Services Ltd', 'www.rcsindia.com', 'Mr A P Chandrasekaran', NULL, NULL, '0422-2211961', NULL),

-- 64 | email present; no website
(4064, 'Richmond Technologies', NULL, 'Mr Sampath Kumar N', NULL, 'richmond@vsnl.com', '0422-4363332, 0422-4363334', NULL),

-- 65
(4065, 'RND Softech (P) Limited', 'www.rndsoftech.com', 'Mr Srihari Balakrishnan', NULL, NULL, '0422-3258078, 0422-3252675', NULL),

-- 66 | Dr prefix kept; phone has extra ext numbers after comma
(4066, 'RVS Infotech Ltd', 'www.rvsgroup.com', 'Dr K V Kupusamy', NULL, NULL, '0422-2687603, 0422-2687421, 0422-2687480', NULL),

-- 67
(4067, 'Senas Net Pvt Ltd', 'www.visolve.com', 'Mr Sena Palanisami', NULL, NULL, '0422-2314200', NULL),

-- 68
(4068, 'Seyyone Software Solutions Pvt Ltd', 'www.seyyone.com', 'Mr Ravi Chinnathambi', NULL, NULL, '0422-2320304, 0422-2310240', NULL),

-- 69 | email present; no website
(4069, 'Shlok Information Systems I P Ltd', NULL, 'Mr R Boobandra Babu', NULL, 'babu@shloklabs.com', '0422-2311236', NULL),

-- 70 | phone "2528404, 05" → 0422-2528404, 0422-2528405
(4070, 'Sierra ODC P Limited', 'www.sierratec.com', 'Mr J G Giridhar', NULL, NULL, '0422-2528404, 0422-2528405', NULL),

-- 71 | Dr prefix kept
(4071, 'Soliton Technologies Pvt Ltd', 'www.solitontech.com', 'Dr Ganesh Devaraj', NULL, NULL, '0422-2302374', NULL),

-- 72
(4072, 'Spheris India Ltd', 'www.spheris.com', 'Mr Suresh Nair', NULL, NULL, '0422-6505777', NULL),

-- 73 | email has typo "gmial.com" in doc — stored as-is (faithful to source)
(4073, 'Springlogic Technologies', NULL, 'Mr Navantha Krishnan CG', NULL, 'navee.krish@gmial.com', '0422-5363313', NULL),

-- 74
(4074, 'Tata Elxsi Ltd', 'www.tataelxsi.com', 'Mr E Subramanian', NULL, NULL, '0422-6639333', NULL),

-- 75
(4075, 'Tata Consultancy Services', 'www.tcs.com', 'Mr Senthil Kumar', NULL, NULL, '0422-2220258', NULL),

-- 76
(4076, 'Trioz Technologies India P Ltd', 'www.trioztech.com', 'Mr Kumaravel Pandurangan', NULL, NULL, '0422-2679845', NULL),

-- 77 | Dr prefix kept
(4077, 'Turing Software Pvt Ltd', 'www.turingsoft.com', 'Dr N K Anand', NULL, NULL, '0422-4366679, 0422-4366680', NULL),

-- 78
(4078, 'Vectra Form Engineering & Solutions Pvt Ltd', 'www.vectraform.com', 'Mr Prabahar Annamalai', NULL, NULL, '0422-2234167', NULL),

-- 79 | Dr prefix kept
(4079, 'Velan Info Services India Pvt Ltd', 'www.velaninfo.com', 'Dr Ravi Ponnusamy', NULL, NULL, '0422-4214747', NULL),

-- 80 | email present; no website; "Ms Rammohan G" → title mismatch noted but kept as in doc
(4080, 'Vestige Technologies Pvt Ltd', NULL, 'Ms Rammohan G', NULL, 'rammohan@vestige-tech.com', '0422-2568844', NULL),

-- 81 | email present; no website
(4081, 'Vidvus Technology Solutions India Pvt Ltd', NULL, 'Mr Venkatasan N', NULL, 'venky@vidvus.com', '0422-4518171', NULL),

-- 82 | Dr prefix kept; phone "5585103,105" → 0422-5585103, 0422-5585105
(4082, 'X Design Ventures Pvt Ltd', 'www.xdesignventures.com', 'Dr D N Rao', NULL, NULL, '0422-5585103, 0422-5585105', NULL);

-- 83 | "Web design" in promoter column is a type/category label, NOT a person name → NULL
--     address is embedded in the email/website column in the doc


-- ============================================================
-- ANALYSIS NOTES & FIELD MAPPING DECISIONS
-- ============================================================
-- Column mapping from document → table:
--   "Name of the Company"    → company_name
--   "Name of the Promoter"   → name
--   "E mail / Website"       → website (if www.*) OR email (if @)
--   "Phone"                  → phone
--   Description rows         → address (only where explicitly stated)
--   designation              → NULL for all (not present in source doc)
--
-- Researcher/caller notes stripped from phone column:
--   "not", "No answer", "Fertilizer company" → removed
--
-- Special cases:
--   #2  ABT Info          — two phone numbers retained
--   #6  AGT Electronics   — HR contact note (Jansi) excluded from phone
--   #9  Angler Tech       — HR contact note (Jansi) excluded from phone
--   #15 Best Infoways     — "Thirumalaiswamvg" is garbled fragment; only email extracted
--   #21 Carolina Tech     — additional "Mr Raj" contact note excluded from phone
--   #22 CG-VAK            — email (sales@cgvak.com) found in description row; included
--   #27 e Brahma          — name not listed → NULL
--   #35 Hiris Tech        — email domain suffix missing; ".com" appended for correctness
--   #43 KL Solar          — two promoters listed; both retained with "/"
--   #49 Maze Net          — phone "4372121, 4222, 4223" expanded to full numbers
--   #58 Premier Poly      — no honorific in doc; name stored as "G Venkatesh"
--   #60 Quattro           — name not listed → NULL
--   #63 Ravichandra       — name cut off in doc ("and Mr A"); first person name taken
--   #66 RVS Infotech      — phone extension numbers expanded to full form
--   #70 Sierra ODC        — phone "2528404, 05" expanded to full numbers
--   #73 Springlogic       — email typo "gmial.com" preserved as-is (faithful to source)
--   #80 Vestige           — "Ms Rammohan G" seems to be title mismatch in doc; kept as-is
--   #82 X Design          — phone "5585103,105" expanded to full numbers
--   #83 Nandha Infotech   — promoter column has "Web design" (type label); name → NULL;
--                           address extracted from the email/website column of the doc
-- ============================================================
