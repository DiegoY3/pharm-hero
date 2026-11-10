/* ===== ECG 3D viewer · DRUG BOX DATA (owned by Druggy / Diego) =====
 * The yellow Drug Box UI (assets/drug-box-ui.js) renders ONLY what is in window.DRUG_BOX below.
 * To update: replace this object (same schema) and refresh index.html. No other file needs changes.
 * Schema "ecg-drug-box/1":
 *   drugs[key]   = { name, alias, module, classification[], mechanism_of_action[], dosage[{who:'Adult'|'Pediatric', t}], indications[], contraindications[], precautions[], side_adverse_effects[], special_considerations[] }
 *   rhythms[id]  = { note, drugIndicated, noConvert?, also?[] (non-drug actions), drugs:[{ drug:<drugs key>, role:'first'|'next'|'cond'|'sed'|'avoid', why,
 *                    doseMatch?: regex source selecting which dosage lines to highlight,
 *                    administer?: { label, fx, to?:<rhythm id>, toV?:<variant>, toTxt?, delay?:ms } }] }
 *   drugs[key].source? = citation of source class (Diego list / AHA ACLS·PALS / NREMT / FDA label); module:null = not on Diego’s list (shows as EXTRA)
 *   topics[id]   = optional teaching topics with no rhythm id (postrosc, cardiogenicshock, digoxintox, hypothermia, bbb): { title, source, note, also[], drugs[] same row format as rhythms } — UI ignores until wired
 *   Rhythm ids: nsr, sbrady, stach, sarrhythmia, sarrest, sexit, pac, wap, mat, afib, afrvr, flutter, svt, pjc, jxesc, accjx, jxtach, pvc, ufpvc, mfpvc, bigeminy, ivr, aivr, vt, torsades, avb1, mobitz1, mobitz2, avb3, apaced, vpaced, vf, pvt, pea, asystole
 * Druggy can also push live at runtime:  DrugBox.load(payloadObject)   (merges drugs/rhythms, re-renders)
 * 2026-10-09 Build Two: + topics; hypothermia/digoxin remarks. (2026-11-10 Pharm Hero: two non-module drug entries removed per Diego.) Sources: AHA ACLS/PALS 2020+2023, AHA/ACC STEMI 2013, NREMT Paramedic.
 */
window.DRUG_BOX = {
 "schema": "ecg-drug-box/1",
 "updated": "2026-10-09",
 "owner": "Druggy (Diego’s drug-info bot)",
 "disclaimer": "",
 "roles": {
  "first": "1st line",
  "next": "Next / 2nd line",
  "cond": "Only if cause suspected",
  "sed": "Procedure support",
  "avoid": "Avoid"
 },
 "drugs": {
  "albuterol": {
   "name": "Albuterol Sulfate",
   "alias": "Proventil, Ventolin",
   "module": 1,
   "classification": [
    "Beta 2 agonist",
    "Sympathomimetic bronchodilator"
   ],
   "mechanism_of_action": [
    "Relaxes bronchial smooth muscle by stimulating beta 2 receptors resulting in bronchodilation and decreased airway resistance"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "2.5-5 mg via nebulizer (>20kg or 2yo)"
    },
    {
     "who": "Pediatric",
     "t": ">2yo or >20kg: 2.5 mg via nebulizer"
    },
    {
     "who": "Pediatric",
     "t": "<20kg or 2yo: 1.25 mg NS via nebulizer"
    }
   ],
   "indications": [
    "Bronchial asthma",
    "COPD/Chronic Bronchitis/Emphysema",
    "Crush syndrome (>4 hrs.)",
    "Bronchospasm due to anaphylaxis, burns, toxic inhalation"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "Tachydysrhythmias"
   ],
   "precautions": [
    "May cause dysrhythmias and tachycardia"
   ],
   "side_adverse_effects": [
    "Tachycardia",
    "Anxiety",
    "Dysrhythmias",
    "Throat irritation"
   ],
   "special_considerations": [
    "Tremors",
    "Palpitations",
    "Dry mouth"
   ]
  },
  "ipratropium": {
   "name": "Ipratropium Bromide",
   "alias": "Atrovent",
   "module": 1,
   "classification": [
    "Anticholinergic",
    "Bronchodilator"
   ],
   "mechanism_of_action": [
    "Inhibits interaction of acetylcholine at receptor sites on bronchial smooth muscle. Decreases airway secretions and promotes bronchodilation."
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "DuoNeb: Albuterol/Atrovent nebulizer (2.5mg/0.5mg)"
    },
    {
     "who": "Adult",
     "t": "No repeat for Atrovent"
    },
    {
     "who": "Pediatric",
     "t": "DuoNeb: <2yo Albuterol/Atrovent (1.25mg/0.25mg) mixed with 2-3ml"
    },
    {
     "who": "Pediatric",
     "t": ">2yo or >20kg: 0.5mg with 2.5mg Albuterol"
    }
   ],
   "indications": [
    "Bronchial asthma",
    "COPD/Emphysema/Chronic Bronchitis",
    "Anaphylaxis",
    "Burns",
    "Toxic inhalations"
   ],
   "contraindications": [
    "Known hypersensitivity to Ipratropium Bromide and Atropine"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Tachycardia",
    "Headache"
   ],
   "special_considerations": [
    "Nausea and vomiting",
    "Blurred vision"
   ]
  },
  "magnesium": {
   "name": "Magnesium Sulfate",
   "alias": "",
   "module": 1,
   "classification": [
    "Electrolyte",
    "Anticonvulsant",
    "Antidysrhythmic",
    "CNS depressant",
    "Smooth Muscle Relaxant"
   ],
   "mechanism_of_action": [
    "Antidysrhythmic: physiological Ca channel blocker, reduces SA node impulse formation, prolongs conduction time in myocardium. Anticonvulsant: reduces striated muscle contractions, blocks peripheral neuromuscular transmission by reducing acetylcholine release at the myoneural junction"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Continuous eclamptic seizure: 4g diluted in 50ml NS/D5W slow IV over 5-10min"
    },
    {
     "who": "Adult",
     "t": "Refractory VFib/TdP w/o pulse: 1-2g diluted in 50ml D5W over 2min"
    },
    {
     "who": "Adult",
     "t": "TdP with pulse: 2g diluted in 50ml D5W slow IVP over 10min"
    },
    {
     "who": "Adult",
     "t": "Refractory bronchospasm/status asthmaticus: 1-2g in 50ml NS/D5W over 5-10min"
    },
    {
     "who": "Pediatric",
     "t": "Refractory VFib/TdP w/o pulse: 25-50mg/kg diluted in 50ml over 2min, max 2g"
    }
   ],
   "indications": [
    "Preeclampsia",
    "Eclampsia",
    "Torsades des Pointes",
    "Refractory VFib/pulseless VTach with suspected hypomagnesaemia",
    "Status asthmaticus"
   ],
   "contraindications": [
    "Myasthenia Gravis",
    "Impaired renal function"
   ],
   "precautions": [],
   "side_adverse_effects": [],
   "special_considerations": []
  },
  "methylprednisolone": {
   "name": "Methylprednisolone",
   "alias": "Solu-Medrol",
   "module": 1,
   "classification": [
    "Corticosteroid",
    "Immunosuppressant",
    "Anti-inflammatory"
   ],
   "mechanism_of_action": [
    "Enters target cells causing complex anti-inflammatory/immunosuppressive reactions",
    "Thought to stabilize cellular and intracellular membranes",
    "Onset of action within 1-6 hours"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "125 mg slow IV/IO/IM"
    },
    {
     "who": "Pediatric",
     "t": "2 mg/kg slow IV/IO/IM, max 125 mg"
    }
   ],
   "indications": [
    "Allergic reaction/anaphylaxis",
    "Asthma/COPD"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "Premature infant (benzyl alcohol)",
    "Systemic fungal infection"
   ],
   "precautions": [
    "Give IM injections in a large muscle mass due to associated pain"
   ],
   "side_adverse_effects": [
    "None from a single dose"
   ],
   "special_considerations": []
  },
  "naloxone": {
   "name": "Naloxone",
   "alias": "Narcan",
   "module": 1,
   "classification": [
    "Narcotic antagonist"
   ],
   "mechanism_of_action": [
    "Reverses all effects due to opioid (morphine-like) agents",
    "Reverses respiratory depression and all central/peripheral nervous system effects"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "0.4-2.0 mg IV/IO/IM"
    },
    {
     "who": "Adult",
     "t": "2mg/2ml IN"
    },
    {
     "who": "Adult",
     "t": "Repeat PRN to maintain respirations"
    },
    {
     "who": "Pediatric",
     "t": "0.1 mg/kg IV/IO/IM/IN"
    },
    {
     "who": "Pediatric",
     "t": "Max initial dose 2mg"
    },
    {
     "who": "Pediatric",
     "t": "Max total 0.5mg/kg"
    },
    {
     "who": "Pediatric",
     "t": "Repeat PRN"
    }
   ],
   "indications": [
    "Reverse respiratory and CNS depression induced by opiates"
   ],
   "contraindications": [
    "Neonates born to addicted mothers"
   ],
   "precautions": [
    "Should be titrated so respiratory efforts return, not intended to restore full consciousness"
   ],
   "side_adverse_effects": [
    "None clinically significant"
   ],
   "special_considerations": []
  },
  "ondansetron": {
   "name": "Ondansetron Hydrochloride",
   "alias": "Zofran",
   "module": 1,
   "classification": [
    "Anti-emetic"
   ],
   "mechanism_of_action": [
    "Mechanism not fully understood",
    "Selective 5-HT3 serotonin receptor antagonist"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "4mg undiluted slow IV"
    },
    {
     "who": "Adult",
     "t": "4mg ODT tablet dissolved in mouth"
    },
    {
     "who": "Pediatric",
     "t": "0.1mg/kg undiluted slow IV, max 4mg"
    },
    {
     "who": "Pediatric",
     "t": ">2YO 4mg ODT PO"
    },
    {
     "who": "Pediatric",
     "t": "<2YO 2mg ODT PO"
    }
   ],
   "indications": [
    "Control and prevention of nausea and vomiting"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "Prolonged QT syndrome"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Gastrointestinal symptoms",
    "Fever",
    "Chest pain (rare)"
   ],
   "special_considerations": [
    "Headache",
    "Blurred vision",
    "EKG changes"
   ]
  },
  "aspirin": {
   "name": "Aspirin",
   "alias": "ASA, Acetylsalicylic Acid",
   "module": 2,
   "classification": [
    "Antiplatelet",
    "Antipyretic",
    "Analgesic",
    "Anti-inflammatory"
   ],
   "mechanism_of_action": [
    "Prevents formation of Thromboxane A2, inhibiting the clotting cascade by decreasing platelet aggregation",
    "Prolongs bleeding time"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Adult: 81-324 mg (1-4 x 81 mg tablets)"
    }
   ],
   "indications": [
    "Chest pain of suspected cardiac origin",
    "Acute Coronary Syndromes (with/without Chest pain)"
   ],
   "contraindications": [
    "Allergy to ASA",
    "Any bleeding disorder"
   ],
   "precautions": [
    "Advise patient to chew/gum the pills for faster absorption",
    "Caution with recent surgical procedures"
   ],
   "side_adverse_effects": [
    "Allergic reaction",
    "Bleeding"
   ],
   "special_considerations": []
  },
  "diphenhydramine": {
   "name": "Diphenhydramine Hydrochloride",
   "alias": "Benadryl",
   "module": 2,
   "classification": [
    "Antihistamine"
   ],
   "mechanism_of_action": [
    "H1 receptor antagonist blocking histamine from binding, reducing allergic and anaphylactic response and the allergy cascade"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "25-50 mg slow IV/IO/IM"
    },
    {
     "who": "Pediatric",
     "t": "1 mg/kg slow IV/IO/IM, max single dose 25 mg"
    }
   ],
   "indications": [
    "Allergic reaction/Anaphylaxis",
    "Dystonic reactions",
    "Chemical restraint"
   ],
   "contraindications": [
    "Known allergy to diphenhydramine",
    "Acute asthma exacerbation"
   ],
   "precautions": [
    "Use caution with severe vomiting, alcohol intoxication",
    "Medical consultation for nursing mothers",
    "Decreased LOC"
   ],
   "side_adverse_effects": [
    "Drowsiness",
    "Tachycardia",
    "Loss of coordination",
    "Palpitations",
    "Blurred vision",
    "Thickening of bronchial secretions leading to chest tightness",
    "Headache",
    "Wheezing",
    "Hypotension"
   ],
   "special_considerations": []
  },
  "epinephrine": {
   "name": "Epinephrine",
   "alias": "1:10,000/1:1,000 - Epi, Adrenalin",
   "module": 2,
   "classification": [
    "Adrenergic catecholamine",
    "Sympathomimetic (vasopressor)"
   ],
   "mechanism_of_action": [
    "Alpha - peripheral vasoconstriction and \"fight or flight\" response",
    "Beta1 - increased contractility, inotropy, dromotropy, automaticity",
    "Beta2 - bronchodilation and skeletal muscle vasodilation"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Cardiac Arrest (1:10,000): 1mg q3-5min"
    },
    {
     "who": "Adult",
     "t": "ROSC: 0.1-0.5 mcg/kg/min (1mg/250ml NS)"
    },
    {
     "who": "Adult",
     "t": "Bradycardia (1mg/250ml D5W Drip): 2-10mcg/min IV"
    },
    {
     "who": "Adult",
     "t": "Anaphylactic Shock/Asthma (1:1,000): 0.3-0.5mg SQ/IM"
    },
    {
     "who": "Adult",
     "t": "Croup (1:1,000): not indicated"
    },
    {
     "who": "Adult",
     "t": "Severe reactions: 0.1mg (1:10,000) slow IV/IO over 5min"
    },
    {
     "who": "Pediatric",
     "t": "Cardiac Arrest (1:10,000): 0.01mg/kg q3-5min"
    },
    {
     "who": "Pediatric",
     "t": "Bradycardia (1:10,000): 0.01mg/kg IV/IO q3-5min"
    },
    {
     "who": "Pediatric",
     "t": "Anaphylactic Shock/Asthma (1:1,000): 0.01mg/kg SQ/IM, max 0.3mg"
    },
    {
     "who": "Pediatric",
     "t": "Croup (1:1,000): 3mg in 3ml NS via neb, repeat once"
    },
    {
     "who": "Pediatric",
     "t": "Croup (1:1,000): 0.01mg/kg SC/IM, max 0.3mg"
    }
   ],
   "indications": [
    "Cardiac arrest",
    "Severe anaphylaxis",
    "Bronchial asthma",
    "Respiratory stridor (croup)",
    "Symptomatic bradycardia",
    "ROSC"
   ],
   "contraindications": [
    "Hypertension",
    "None in cardiac arrest setting"
   ],
   "precautions": [
    "Restrict to cardiac arrest if patient having an AMI",
    "IVP (1:1,000) should not be given to any patient",
    "IV epi reserved for cardiac arrest/impending arrest from anaphylaxis"
   ],
   "side_adverse_effects": [
    "Tachydysrhythmias",
    "Hypertension",
    "May induce early labor",
    "Headache",
    "Nervousness",
    "Rebound edema 20-30min after croup dosing",
    "Tremors"
   ],
   "special_considerations": []
  },
  "furosemide": {
   "name": "Furosemide",
   "alias": "Lasix",
   "module": 2,
   "classification": [
    "Loop diuretic"
   ],
   "mechanism_of_action": [
    "Inhibits reabsorption of NaCl in the loop of Henle and proximal tubule of the nephron. Water follows salt, so water is also not reabsorbed and is excreted as urine."
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Adults only: 0.5-1 mg/kg slow IV/IO"
    },
    {
     "who": "Adult",
     "t": "40 mg if not taking Lasix, 80 mg if taking Lasix"
    }
   ],
   "indications": [
    "CHF",
    "Pulmonary edema"
   ],
   "contraindications": [
    "Hypovolemia/dehydration",
    "Hypokalemia/electrolyte depletion"
   ],
   "precautions": [
    "Incompatible with other medications (flush line well!!)"
   ],
   "side_adverse_effects": [
    "Hypotension",
    "Electrolyte imbalances"
   ],
   "special_considerations": []
  },
  "morphine": {
   "name": "Morphine Sulfate",
   "alias": "",
   "module": 2,
   "classification": [
    "Narcotic analgesic"
   ],
   "mechanism_of_action": [
    "Decreases pain perception and anxiety, produces euphoria",
    "Decreases respiratory effort",
    "Causes peripheral dilation which decreases preload",
    "Decreases left ventricular afterload"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "AMI/Pulmonary Edema 2-10mg slow IV/IO/IM (SBP>90), pain not relieved by NTG"
    },
    {
     "who": "Adult",
     "t": "Burns 2-20mg slow IV/IO/IM"
    },
    {
     "who": "Adult",
     "t": "Isolated injury 2-10mg slow IV/IO/IM, additional 2-10mg max 20mg"
    },
    {
     "who": "Pediatric",
     "t": "Isolated injury 0.1mg/kg slow IV or IM (SBP>100), max 10mg"
    }
   ],
   "indications": [
    "Acute myocardial infarction",
    "Isolated injuries requiring pain relief",
    "Burns",
    "Pulmonary edema/CHF"
   ],
   "contraindications": [
    "Head injury",
    "COPD with compromised respiratory effort",
    "Hypotension",
    "Sensitivity to morphine, codeine, or Percodan",
    "Multiple system trauma (relative)"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Respiratory depression/arrest",
    "AMS (decreased LOC)",
    "Increased vagal tone from suppression of sympathetic pathways",
    "Nausea and vomiting",
    "Bronchospasm",
    "Pruritus"
   ],
   "special_considerations": []
  },
  "nitroglycerin": {
   "name": "Nitroglycerin",
   "alias": "Nitrostat, Tridil",
   "module": 2,
   "classification": [
    "Nitrate",
    "Vasodilator"
   ],
   "mechanism_of_action": [
    "Vasodilator effect on veins more than arteries",
    "Decreases preload by venous pooling, decreasing myocardial workload and O2 consumption"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Chest Pain: 0.4mg SL q3-5min, max 1.2mg"
    },
    {
     "who": "Adult",
     "t": "Pulmonary Edema/CHF: 0.4mg SL q3-5min, max 1.2mg"
    },
    {
     "who": "Adult",
     "t": "Nitro Paste: 1\" applied to chest wall"
    },
    {
     "who": "Adult",
     "t": "If hypotension results, remove and wipe site clean with gauze"
    }
   ],
   "indications": [
    "Angina",
    "CHF",
    "Acute pulmonary edema",
    "Symptomatic hypertensive crisis"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "Pediatric <12yo",
    "Viagra/Levitra within 24hr",
    "Cialis within 48hr",
    "Asymptomatic hypertension",
    "SBP <90mmHg",
    "Right-side MI (ST elevation V4R)"
   ],
   "precautions": [
    "Extreme caution with inferior AMI (risk of right-sided AMI) - perform right-sided 12 lead EKG"
   ],
   "side_adverse_effects": [
    "Headache",
    "Nausea",
    "Dizziness"
   ],
   "special_considerations": [
    "Hypotension",
    "Vomiting",
    "Decreased LOC"
   ]
  },
  "adenosine": {
   "name": "Adenosine",
   "alias": "Adenocard",
   "module": 3,
   "classification": [
    "Antidysrhythmic Agent"
   ],
   "mechanism_of_action": [
    "Slows conduction by decreasing automaticity in SA and AV nodes therefore decreasing tachycardias that originate above the ventricles."
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Administer via rapid IV/IO (Humeral head) followed by a rapid NSS flush"
    },
    {
     "who": "Adult",
     "t": "1st: 6 mg 2nd: 12 mg if no response in 2 min"
    },
    {
     "who": "Pediatric",
     "t": "Administer via rapid IV/IO (Humeral head) followed by a rapid NSS flush"
    },
    {
     "who": "Pediatric",
     "t": "1st: 0.1 mg/kg, max 6 mg 2nd: 0.2 mg/kg, max 12 mg"
    }
   ],
   "indications": [
    "SVT/PSVT",
    "Wide complex regular tachycardias of unknown origin (diagnostic treatment)"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "WPW (consult med control)",
    "Confirmed VTach, AFib, or Aflutter"
   ],
   "precautions": [
    "Metabolized rapidly, deliver via proximal IV site (AC) or Humeral IO",
    "Caution in asthmatic patients or known heart disease",
    "Be prepared for up to 40 sec of asystole",
    "Consider 3 mg 1st dose: dipyridamole, carbamazepine, heart transplant, central line",
    "Follow with 20ml rapid flush"
   ],
   "side_adverse_effects": [
    "Flushing",
    "Dizziness",
    "Headache",
    "Chest pressure"
   ],
   "special_considerations": [
    "Nausea",
    "Dyspnea",
    "Hypotension"
   ]
  },
  "amiodarone": {
   "name": "Amiodarone",
   "alias": "Cordarone",
   "module": 3,
   "classification": [
    "Antiarrhythmic"
   ],
   "mechanism_of_action": [
    "Blocks multiple channels: Na, K, Ca",
    "Blocks alpha and beta adrenergic receptor",
    "Prolongs the effective refractory period",
    "Chemical defibrillator",
    "Slows conduction through the HIS-Purkinje system",
    "Slows conduction through accessory pathways (WPW)"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Vfib/pulseless VTach: 1st 300 mg IV/IO, 2nd 150 mg in 3-5 min (in 20-30ml D5W), max 450 mg"
    },
    {
     "who": "Adult",
     "t": "VTach with a pulse: 150 mg in 50-100ml D5W over 10 min"
    },
    {
     "who": "Adult",
     "t": "Maintenance Infusion: 1 mg/min (100 mg in 100 ml D5W)"
    },
    {
     "who": "Pediatric",
     "t": "Vfib/pulseless VTach: 5mg/kg IV/IO in 20-30ml D5W q3-5min, max 15mg/kg"
    },
    {
     "who": "Pediatric",
     "t": "VTach with a pulse: 5mg/kg in 100ml D5W over 20-60 min"
    },
    {
     "who": "Pediatric",
     "t": "Maintenance Infusion: No current AHA recommendations"
    }
   ],
   "indications": [
    "VFib",
    "VTach with and without a pulse",
    "Refractory SVT including AFib/Aflutter",
    "Reentry tachycardia rate control (WPW)"
   ],
   "contraindications": [
    "None in cardiac arrest",
    "Cardiogenic shock",
    "SA node dysfunction",
    "Iodine Allergy",
    "High degree heart block (2nd Type II and 3rd)"
   ],
   "precautions": [
    "Combination with other antiarrhythmics may potentiate arrhythmias",
    "Do not agitate vial",
    "If hypotension/bradycardia, STOP infusion and give 250ml-2L fluid bolus"
   ],
   "side_adverse_effects": [
    "Hypotension",
    "CHF",
    "Vomiting"
   ],
   "special_considerations": [
    "Bradycardia",
    "Nausea"
   ]
  },
  "atropine": {
   "name": "Atropine Sulfate",
   "alias": "",
   "module": 3,
   "classification": [
    "Parasympatholytic (vagolytic action)",
    "Anticholinergic (accelerates the heart rate)"
   ],
   "mechanism_of_action": [
    "Inhibits parasympathetic stimulation by blocking acetylcholine receptors",
    "Decreases vagal tone resulting in increased heart rate and AV conduction",
    "Dilates bronchioles and decreases respiratory tract secretions",
    "Decreases GI secretions"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Bradycardia: 1 mg IV/IO/ET q3-5min, max 3 mg"
    },
    {
     "who": "Adult",
     "t": "Cholinergic/Organophosphate Poisoning: 1-4 mg IV/IO/ET/IM q5-10min"
    },
    {
     "who": "Pediatric",
     "t": "Bradycardia: 0.02 mg/kg IV/IO/ET, min 0.1 mg"
    },
    {
     "who": "Pediatric",
     "t": "Cholinergic/Organophosphate Poisoning: 0.01-0.04 mg/kg IV/IO/ET/IM q5-10min"
    }
   ],
   "indications": [
    "Symptomatic bradycardia",
    "Organophosphate poisoning",
    "Cholinergic poisoning"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "Dysrhythmias in which enhancement of conduction may accelerate the ventricular rate and cause decreased cardiac output (AFib, Aflutter, PAT with block)"
   ],
   "precautions": [
    "Not clinically significant"
   ],
   "side_adverse_effects": [
    "Excessive doses can cause delirium, restlessness, disorientation, tachycardia, coma, flushed/hot skin, ataxia, blurred vision, dry mucus membranes",
    "VFib and tachycardia"
   ],
   "special_considerations": []
  },
  "diltiazem": {
   "name": "Diltiazem",
   "alias": "Cardizem",
   "module": 3,
   "classification": [
    "Calcium channel blocker",
    "Antidysrhythmic"
   ],
   "mechanism_of_action": [
    "Binds to open calcium channels preventing repolarization until dissociation",
    "Decreases SA nodal discharge, AV nodal conduction, afterload, and myocardial contractility"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Adult: Initial 0.25 mg/kg slow IV/IO over 5 min, max 20 mg"
    },
    {
     "who": "Adult",
     "t": "Repeat (after 15 min) 0.35 mg/kg over 5 min, max 25 mg"
    },
    {
     "who": "Adult",
     "t": "Maintenance: 5-15 mg/hr titrated to rate"
    }
   ],
   "indications": [
    "Stable uncontrolled Aflutter or AFib with sustained rates >120/min",
    "2nd line med for stable regular narrow complex tachydysrhymias (SVT, PSVT)"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "Shock or hypotension",
    "High degree heart block (2nd Type II or 3rd), heart failure, and VT"
   ],
   "precautions": [
    "Avoid in nursing mothers",
    "Administer during pregnancy only if benefits justify risk to fetus"
   ],
   "side_adverse_effects": [
    "Hypotension",
    "Nausea and vomiting"
   ],
   "special_considerations": [
    "Dysrhythmias",
    "Headache"
   ]
  },
  "dopamine": {
   "name": "Dopamine Hydrochloride",
   "alias": "Intropin",
   "module": 3,
   "classification": [
    "Sympathomimetic Vasopressor",
    "Inotropic agent"
   ],
   "mechanism_of_action": [
    "Alpha and beta adrenergic receptor stimulator",
    "Dopaminergic receptor stimulator",
    "Precursor of norepinephrine",
    "Low (renal) 1-2, Moderate (cardiac) 2-10, High (vasopressor) 10-20 mcg/kg/min"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "IV use only"
    },
    {
     "who": "Adult",
     "t": "Adjust to clinical response (systolic BP >90 mmHg)"
    },
    {
     "who": "Adult",
     "t": "5-20 mcg/kg/min, typically starts 5 mcg/kg/min"
    },
    {
     "who": "Pediatric",
     "t": "IV use only"
    },
    {
     "who": "Pediatric",
     "t": "Adjust to clinical response (systolic BP >90 mmHg)"
    },
    {
     "who": "Pediatric",
     "t": "2-20 mcg/kg/min, typically starts 2 mcg/kg/min titrated to age-specific BP"
    }
   ],
   "indications": [
    "Cardiogenic shock",
    "Septic shock",
    "Anaphylactic shock",
    "Hypovolemic shock (after volume replacement)",
    "Symptomatic bradycardia (after Atropine)"
   ],
   "contraindications": [
    "Pre-existing tachydysrhythmias",
    "Uncorrected hypovolemia"
   ],
   "precautions": [
    "Report extravasation to hospital staff on arrival",
    "Patients on MAOIs are extremely sensitive (use much lower dose)",
    "Pheochromocytoma patients may develop profound hypertension to minimal doses",
    "Not in the same IV line as Sodium Bicarbonate",
    "Consider alternative pressor if MAP <65 mmHg"
   ],
   "side_adverse_effects": [
    "Angina",
    "Nausea and vomiting"
   ],
   "special_considerations": [
    "Tachydysrhythmias",
    "Hypertension"
   ]
  },
  "lidocaine": {
   "name": "Lidocaine",
   "alias": "Xylocaine",
   "module": 3,
   "classification": [
    "Antidysrhythmic",
    "Sodium Channel Blocker"
   ],
   "mechanism_of_action": [
    "Suppresses ventricular dysrhythmias by stabilizing cell membranes",
    "Blocks fast sodium channels increasing recovery period during repolarization",
    "Increases VFib threshold",
    "Acts only on ventricular rhythms"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "W/ pulse: 0.5-1.5mg/kg slow IV/IO q5-10min PRN, max 3mg/kg (repeat at half dose if >1mg/kg)"
    },
    {
     "who": "Adult",
     "t": "W/o pulse: 1-1.5mg/kg IV/IO q5-10min PRN, max 3mg/kg (repeat at half dose)"
    },
    {
     "who": "Adult",
     "t": "IO numbing: 20-40mg slow IO"
    },
    {
     "who": "Adult",
     "t": "Maintenance infusion post-ROSC: 1-4 mg/min (1g/250ml D5W = 4mg/ml)"
    },
    {
     "who": "Pediatric",
     "t": "1mg/kg slow IV/IO q5-10min PRN, max 3mg/kg"
    },
    {
     "who": "Pediatric",
     "t": "IO numbing: 0.5mg/kg slow IO"
    }
   ],
   "indications": [
    "VTach with/without pulse (2nd to Amiodarone in adults)",
    "VFib",
    "Prevent recurrence of VF/VT after defibrillation (maintenance drip)",
    "Reduce malignant PVCs",
    "Via IO for numbing from IO infusion pain"
   ],
   "contraindications": [
    "AV blocks",
    "Idioventricular escape rhythms",
    "AIVR",
    "Sinus bradycardia/arrest/block",
    "Stokes-Adams Syndrome",
    "WPW Syndrome",
    "Sensitivity to lidocaine"
   ],
   "precautions": [
    "Reduce dose with decreased cardiac output, liver dysfunction, elderly (>70)",
    "Bolus over 1 min except in VFib/VTach",
    "Inactivated by Sodium Bicarb, separate line or flush"
   ],
   "side_adverse_effects": [
    "May cause clinical evidence of toxicity usually related to the CNS"
   ],
   "special_considerations": []
  },
  "metoprolol": {
   "name": "Metoprolol",
   "alias": "Lopressor",
   "module": 3,
   "classification": [
    "Beta blocker"
   ],
   "mechanism_of_action": [
    "Decreases heart rate, conduction velocity, and myocardial contractility, reducing cardiac output and O2 demand",
    "Blocks beta receptors in bronchial smooth muscle, inhibiting bronchodilation"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Adults only: 5 mg slow IVP over 5 min"
    },
    {
     "who": "Adult",
     "t": "Repeat x2 q5min"
    },
    {
     "who": "Adult",
     "t": "Stop if SBP <90 mmHg or difficulty breathing develops"
    }
   ],
   "indications": [
    "Refractory PSVT/SVT",
    "Afib/Aflutter with sustained ventricular rate >120",
    "ACS with STEMI and tachycardia"
   ],
   "contraindications": [
    "HR <100 bpm (relative)",
    "SBP <90 mmHg",
    "2nd/3rd degree AV block",
    "Asthma attack or COPD exacerbation",
    "Shock"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Hypotension",
    "CHF",
    "CNS changes"
   ],
   "special_considerations": [
    "Dysrhythmias",
    "Nausea and vomiting"
   ]
  },
  "verapamil": {
   "name": "Verapamil",
   "alias": "Isoptin",
   "module": 3,
   "classification": [
    "Calcium channel blocker",
    "Antidysrhythmic"
   ],
   "mechanism_of_action": [
    "Binds to calcium channels, preventing repolarization until dissociation",
    "Decreases SA nodal discharge, AV nodal conduction, afterload, and myocardial contractility",
    "Dilates coronary arteries"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Initial 2.5-5mg IV/IO over 2min"
    },
    {
     "who": "Adult",
     "t": "Repeat 5-10mg IV/IO in 15-30min"
    },
    {
     "who": "Adult",
     "t": "Max 20mg"
    },
    {
     "who": "Pediatric",
     "t": "Not indicated"
    }
   ],
   "indications": [
    "Stable, uncontrolled Aflutter or Afib with RVR",
    "2nd line medication for stable, narrow complex tachydysrhythmias (PSVT/SVT)"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "Shock or hypotension",
    "WPW, sick sinus syndrome, high degree heart block (2nd Type II or 3rd), heart failure and VT"
   ],
   "precautions": [
    "Avoid in nursing mothers",
    "Administer in pregnancy only if benefits justify risk to fetus"
   ],
   "side_adverse_effects": [
    "Hypotension",
    "Nausea and vomiting"
   ],
   "special_considerations": [
    "Dysrhythmias",
    "Headache"
   ]
  },
  "calciumchloride": {
   "name": "Calcium Chloride",
   "alias": "10%",
   "module": 4,
   "classification": [
    "Electrolyte"
   ],
   "mechanism_of_action": [
    "Increases cardiac contractile state and ventricular automaticity",
    "Useful in reversing arrhythmias due to hyperkalemia"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "2-4 g slow IV/IO at 100 mg/min, repeat PRN q10min"
    },
    {
     "who": "Adult",
     "t": "Cardiac arrest given over 2 min"
    },
    {
     "who": "Pediatric",
     "t": "20 mg/kg (0.2 ml/kg) at 100 mg/min, max 0.5 g (5 ml)"
    }
   ],
   "indications": [
    "Hyperkalemia",
    "Hypocalcemia",
    "Calcium channel blocker overdose",
    "Hypermagnesaemia",
    "Crush syndrome (suspected hyperkalemia)"
   ],
   "contraindications": [
    "Not indicated in cardiac arrest except when hyperkalemia, hypocalcemia, or Ca channel toxicity is highly suspected",
    "Digoxin patient with suspected Ca channel overdose"
   ],
   "precautions": [
    "Administer slowly to avoid bradycardia and/or hypotension",
    "Caution with Digoxin, may precipitate digitalis toxicity"
   ],
   "side_adverse_effects": [
    "Syncope",
    "Arrhythmia"
   ],
   "special_considerations": [
    "Cardiac arrest",
    "Bradycardia"
   ]
  },
  "dextrose": {
   "name": "Dextrose",
   "alias": "D50W, D25W, D10W",
   "module": 4,
   "classification": [
    "Hyperglycemic agent",
    "Monosaccharide, principle form of carbohydrate in the body"
   ],
   "mechanism_of_action": [
    "Increases circulating blood sugar"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "D50W 25g IV, D10 100ml's and reassess (drip)"
    },
    {
     "who": "Pediatric",
     "t": "0.5-1 g/kg"
    },
    {
     "who": "Pediatric",
     "t": ">2mo but <2YO: 2-4 ml/kg D25W"
    },
    {
     "who": "Pediatric",
     "t": ">2YO: 1-2 ml/kg D50W max 25g"
    },
    {
     "who": "Pediatric",
     "t": "<2mo old: 5-10 ml/kg D10W"
    }
   ],
   "indications": [
    "Correction of AMS due to hypoglycemia, seizures, and cardiac arrest"
   ],
   "contraindications": [
    "Known hyperglycemia",
    "Intracranial hemorrhage",
    "CVA (unless hypoglycemic)"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Hyperglycemia"
   ],
   "special_considerations": []
  },
  "glucagon": {
   "name": "Glucagon",
   "alias": "GlucaGen",
   "module": 4,
   "classification": [
    "Hyperglycemic agent",
    "Pancreatic hormone"
   ],
   "mechanism_of_action": [
    "Hormone synthesized by the pancreas",
    "Increases blood glucose by releasing glycogen stores in the liver/skeletal muscles",
    "May increase heart rate and cardiac output"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Suspected hypoglycemia w/o IV access: 1mg IM"
    },
    {
     "who": "Adult",
     "t": "Beta/Ca blocker OD unresponsive: 1-3mg slow IVP, then infuse 3mg/hr"
    },
    {
     "who": "Adult",
     "t": "Steakhouse syndrome: 1mg IV"
    },
    {
     "who": "Pediatric",
     "t": "Suspected hypoglycemia w/o IV access: >20kg same as adult, <20kg 0.5mg IM"
    },
    {
     "who": "Pediatric",
     "t": "Beta/Ca blocker OD unresponsive: 0.15mg/kg (max 3mg) slow IVP, then infuse 3mg/hr"
    }
   ],
   "indications": [
    "Hypoglycemic where IV access unobtainable",
    "Ca Channel Blocker OD unresponsive to Calcium Chloride",
    "Bradycardia 2/2 beta blocker OD unresponsive to atropine",
    "Steakhouse syndrome",
    "Bronchospasm 2/2 choking"
   ],
   "contraindications": [
    "Known hypersensitivity"
   ],
   "precautions": [
    "Glucagon only works in hypoglycemia if liver has significant glycogen stores"
   ],
   "side_adverse_effects": [],
   "special_considerations": []
  },
  "sodiumbicarbonate": {
   "name": "Sodium Bicarbonate",
   "alias": "",
   "module": 4,
   "classification": [
    "Buffer",
    "Alkalizing agent"
   ],
   "mechanism_of_action": [
    "Increases plasma bicarbonate",
    "Buffers excess hydrogen ion concentration",
    "Raises blood pH",
    "Reverses clinical manifestations of acidosis"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "1 mEq/kg IV/IO"
    },
    {
     "who": "Adult",
     "t": "Crush injury maintenance: 50mEq/250ml D5W (1ml/min)"
    },
    {
     "who": "Pediatric",
     "t": "1 mEq/kg IV/IO"
    },
    {
     "who": "Pediatric",
     "t": "Crush injury maintenance: 0.5 mEq/kg"
    }
   ],
   "indications": [
    "Cardiac arrest only after more definitive treatments",
    "Hyperkalemia",
    "Tricyclic antidepressant and phenobarbital overdose",
    "Prophylaxis prior to release of crush injuries",
    "Metabolic acidosis"
   ],
   "contraindications": [
    "Pre-existing alkalosis"
   ],
   "precautions": [
    "Inactivates simultaneously administered catecholamines",
    "Give CaCl in a different IV line to avoid calcium carbonate precipitate",
    "Priorities before use: Intubation, Hyperventilation, Defibrillation, Epinephrine, Antiarrhythmics"
   ],
   "side_adverse_effects": [
    "Worsened intracellular acidosis (CO2 formation)",
    "Hyperosmolality",
    "May precipitate CHF",
    "Acute hypokalemia",
    "Exacerbation of central venous acidosis",
    "Shifts oxyhemoglobin dissociation curve"
   ],
   "special_considerations": []
  },
  "thiamine": {
   "name": "Thiamine",
   "alias": "Vitamin B1",
   "module": 4,
   "classification": [
    "Vitamin B1"
   ],
   "mechanism_of_action": [
    "Combines with ATP to form a coenzyme essential for normal metabolism, converting sugar to energy"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Adult Only: 100 mg IM or slow IV/IO"
    }
   ],
   "indications": [
    "Malnourished or alcoholic hypoglycemic patients"
   ],
   "contraindications": [
    "Hypersensitivity"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Tachycardia",
    "Palpitations",
    "Tremors",
    "Dizziness",
    "Vomiting"
   ],
   "special_considerations": [
    "Nervousness",
    "Nausea"
   ]
  },
  "ketorolac": {
   "name": "Ketorolac",
   "alias": "Toradol",
   "module": 4,
   "classification": [
    "Nonsteroidal Anti-Inflammatory"
   ],
   "mechanism_of_action": [
    "Exhibits peripherally acting nonnarcotic analgesic activity by inhibiting prostaglandin synthesis"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "30mg slow IV, IO, IM"
    },
    {
     "who": "Pediatric",
     "t": "0.5 mg/kg slow IV, IO, IM. Max total dose 30mg"
    }
   ],
   "indications": [
    "Management of moderate to severe pain",
    "Patients with history of narcotic medication abuse",
    "Musculoskeletal pain or spasm"
   ],
   "contraindications": [
    "Hypersensitivity/Allergy to ASA or other NSAIDs",
    "Bleeding Disorders",
    "Renal Failure/Dialysis",
    "Active Peptic Ulcers",
    "Head Trauma",
    "History of Cerebral Hemorrhage",
    "Pregnancy"
   ],
   "precautions": [
    "Consider reducing dose in patients >65yo, liver disease, recent/possible surgery",
    "May increase bleeding with anticoagulants",
    "Effects of lithium/methotrexate may increase"
   ],
   "side_adverse_effects": [
    "Anaphylaxis due to hypersensitivity",
    "Headache",
    "Bleeding",
    "Nausea"
   ],
   "special_considerations": [
    "Edema",
    "Sedation",
    "Rash"
   ]
  },
  "diazepam": {
   "name": "Diazepam",
   "alias": "Valium",
   "module": 5,
   "classification": [
    "Sedative hypnotic",
    "Benzodiazepine"
   ],
   "mechanism_of_action": [
    "Short Acting Benzo with Sedative and hypnotic properties"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "RSI/Sedation: 2-5 mg IV/IO q10-15min; Behavioral/Seizures: 2-5 mg slow IV/IO/IM"
    },
    {
     "who": "Pediatric",
     "t": "0.05-0.1 mg/kg slow IV/IO"
    },
    {
     "who": "Pediatric",
     "t": "0.1-0.2 mg/kg IM/IN"
    },
    {
     "who": "Pediatric",
     "t": "0.02 mg/kg (with Ketamine)"
    }
   ],
   "indications": [
    "Sedation of intubated patients",
    "Seizures",
    "Combative patients",
    "Pre-medication prior to TCP/cardioversion"
   ],
   "contraindications": [
    "Hypotension",
    "Respiratory depression",
    "Known hypersensitivity"
   ],
   "precautions": [
    "Effects can be potentiated by CNS depressants such as narcotics and alcohol"
   ],
   "side_adverse_effects": [
    "Respiratory depression",
    "Hypotension"
   ],
   "special_considerations": [
    "Apnea",
    "Amnesia"
   ]
  },
  "fentanyl": {
   "name": "Fentanyl Citrate",
   "alias": "Sublimaze",
   "module": 5,
   "classification": [
    "Narcotic analgesic"
   ],
   "mechanism_of_action": [
    "100 mcg is approximately equivalent in analgesic activity to 10 mg of morphine or 75 mg meperidine"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "50-100 mcg slow IV/IO/IM/IN"
    },
    {
     "who": "Adult",
     "t": "Severe burns max 200 mcg"
    },
    {
     "who": "Pediatric",
     "t": "1-2 mcg/kg slow IV/IO/IM/IN, systolic BP>90"
    },
    {
     "who": "Pediatric",
     "t": "May repeat once after 5min"
    },
    {
     "who": "Pediatric",
     "t": "Max dose 100 mcg"
    }
   ],
   "indications": [
    "Analgesic requirement of short duration (Pain Management)",
    "Sedation maintenance for RSI"
   ],
   "contraindications": [
    "Myasthenia Gravis",
    "Hypotension",
    "Head injury"
   ],
   "precautions": [
    "Avoid in pregnancy unless benefit justifies risk to fetus",
    "May be released in human milk, reconsider use in nursing mothers"
   ],
   "side_adverse_effects": [
    "Resp. depression, apnea, rigidity, hypercapnia (may NOT be resolvable with Naloxone)",
    "Increased effects in elderly/debilitated",
    "Bradycardia (Atropine)",
    "Extrapyramidal symptoms (Diphenhydramine)"
   ],
   "special_considerations": []
  },
  "flumazenil": {
   "name": "Flumazenil",
   "alias": "Romazicon",
   "module": 5,
   "classification": [
    "Benzodiazepine antagonist"
   ],
   "mechanism_of_action": [
    "Competes with benzodiazepines at the receptor sites, reversing the sedative effects"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "0.2 mg IV/IO over 15 seconds"
    },
    {
     "who": "Adult",
     "t": "Repeat q45sec until desired effect or 1 mg max"
    }
   ],
   "indications": [
    "Benzodiazepine over sedation"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "TCA overdose",
    "Seizures",
    "Known benzodiazepine dependence"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Seizures",
    "Nausea/vomiting"
   ],
   "special_considerations": [
    "Dizziness"
   ]
  },
  "midazolam": {
   "name": "Midazolam",
   "alias": "Versed",
   "module": 5,
   "classification": [
    "Sedative hypnotic/Anxiolytic",
    "Benzodiazepine"
   ],
   "mechanism_of_action": [
    "Short-acting benzodiazepine with sedative hypnotic, and amnestic properties"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "1-5 mg slow IV/IO"
    },
    {
     "who": "Adult",
     "t": "0.01-0.02 mg/kg IM/IN, max 5 mg single dose"
    },
    {
     "who": "Pediatric",
     "t": "0.05-0.1 mg/kg slow IV/IO"
    },
    {
     "who": "Pediatric",
     "t": "0.1-0.2 mg/kg IM/IN, max 2 mg single dose"
    }
   ],
   "indications": [
    "Sedation of intubated patients with ventilatory difficulty (bucking/combativeness)",
    "Combative patients",
    "RSI",
    "Seizures",
    "Sedation prior to TCP/cardioversion"
   ],
   "contraindications": [
    "Hypotension",
    "Acute narrow angle glaucoma",
    "Known hypersensitivity"
   ],
   "precautions": [
    "Effects can be accentuated by CNS depressants such as narcotics and alcohol"
   ],
   "side_adverse_effects": [
    "Respiratory depression",
    "Hypotension"
   ],
   "special_considerations": [
    "Apnea",
    "Amnesia"
   ]
  },
  "promethazine": {
   "name": "Promethazine Hydrochloride",
   "alias": "Phenergan",
   "module": 5,
   "classification": [
    "Antihistamine",
    "Anti-emetic"
   ],
   "mechanism_of_action": [
    "Works directly on the emetic receptors of the brain to control nausea and vomiting"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "12.5mg diluted in 10ml NSS IV"
    },
    {
     "who": "Pediatric",
     "t": "0.1mg/kg, max 12.5mg"
    }
   ],
   "indications": [
    "Control and prevention of nausea and vomiting"
   ],
   "contraindications": [
    "Known hypersensitivity"
   ],
   "precautions": [
    "May potentiate the effects of analgesics",
    "May cause respiratory depression",
    "EPS resolvable with Diphenhydramine"
   ],
   "side_adverse_effects": [
    "Drowsiness",
    "Dizziness"
   ],
   "special_considerations": []
  },
  "racemicepinephrine": {
   "name": "Racemic Epinephrine",
   "alias": "1:1,000 Nebulized",
   "module": 5,
   "classification": [
    "Sympathomimetic agonist"
   ],
   "mechanism_of_action": [
    "Causes vasoconstriction to reduce swelling of the upper airway",
    "Relief of bronchospasm"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "≥ 5kg: 0.5ml in 3ml via nebulizer"
    },
    {
     "who": "Adult",
     "t": "< 5kg: 0.25ml in 3ml via nebulizer"
    }
   ],
   "indications": [
    "Croup",
    "Smoke inhalation causing stridor",
    "Bronchiolitis",
    "Asthma refractory to DuoNeb (>4yo)"
   ],
   "contraindications": [
    "Known history of allergy/hypersensitivity to racemic epinephrine"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Tachydysrhythmias",
    "Hypertension",
    "Nervousness",
    "Rebound edema may occur 20-30min after administration in croup patients"
   ],
   "special_considerations": []
  },
  "activatedcharcoal": {
   "name": "Activated Charcoal",
   "alias": "Acta-Char, Actidose, Liqui-Char",
   "module": 6,
   "classification": [
    "Antidote",
    "Adsorbent agent"
   ],
   "mechanism_of_action": [
    "Adsorbs toxins allowing them to pass out through the GI tract"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "25g-50g PO/NG/OG as tolerated"
    },
    {
     "who": "Pediatric",
     "t": "(>2YO): same as adult dose; do not use under 2YO"
    }
   ],
   "indications": [
    "Suspected overdose or accidental ingestion of drugs or chemicals through the oral route"
   ],
   "contraindications": [
    "ALOC or impending ALOC",
    "No gag reflex",
    "TCA overdose",
    "Acids, Alkalis, Methanol, Cyanide, Ferrous sulfate, Lithium"
   ],
   "precautions": [
    "Shake vigorously"
   ],
   "side_adverse_effects": [
    "Nausea/vomiting",
    "Constipation/Diarrhea",
    "Aspiration"
   ],
   "special_considerations": []
  },
  "etomidate": {
   "name": "Etomidate",
   "alias": "Amidate",
   "module": 6,
   "classification": [
    "Sedative hypnotic"
   ],
   "mechanism_of_action": [],
   "dosage": [
    {
     "who": "Adult",
     "t": "0.3 mg/kg IV/IO over 30-60 seconds"
    }
   ],
   "indications": [
    "Induction of responsive patients prior to neuromuscular blocking agents for RSI",
    "Induction agent prior to endotracheal intubation for Medication Assisted Intubation"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "Not recommended for patients <10 years old"
   ],
   "precautions": [
    "Potent drug with rapid onset, be prepared to support and suction airway"
   ],
   "side_adverse_effects": [
    "Respiratory depression",
    "Nausea and vomiting",
    "Pain on injection",
    "Trismus (lock jaw)"
   ],
   "special_considerations": []
  },
  "ketamine": {
   "name": "Ketamine",
   "alias": "",
   "module": 6,
   "classification": [
    "Non-barbiturate anesthetic",
    "Dissociative"
   ],
   "mechanism_of_action": [
    "Rapid-acting general anesthetic producing profound analgesia, normal pharyngeal-laryngeal reflexes, normal/slightly enhanced skeletal muscle tone, cardiovascular/respiratory stimulation, occasional transient minimal respiratory depression",
    "Hypnotic",
    "Amnestic"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "RSI (Paramedic Only): 1-2 mg/kg IV/IO over 60 sec"
    },
    {
     "who": "Adult",
     "t": "RSI (Paramedic Only): 3-4 mg/kg IM"
    },
    {
     "who": "Adult",
     "t": "Pain Management: 5-20mg IV, 25-50mg IM, 20-40mg IN (split nares)"
    },
    {
     "who": "Pediatric",
     "t": "Pain Management: 0.05-0.2mg/kg IV, 0.25-0.75mg/kg IM, 0.2-0.4mg/kg IN (split nares)"
    }
   ],
   "indications": [
    "RSI (induction/continued sedation)",
    "Excited delirium",
    "Pain management",
    "Dislocation reduction"
   ],
   "contraindications": [
    "<3 months of age",
    "Schizophrenic episodes",
    "Pregnancy"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Catecholamine release (elevated HR & BP)",
    "Nausea and vomiting",
    "Increased ICP (safe in head injuries)",
    "Benign rash on face/neck",
    "Purposeless tonic-clonic movements",
    "Drowsiness worsened with alcohol",
    "Bronchial secretions"
   ],
   "special_considerations": []
  },
  "succinylcholine": {
   "name": "Succinylcholine",
   "alias": "Anectine",
   "module": 6,
   "classification": [
    "Neuromuscular blocking agent (depolarizing)"
   ],
   "mechanism_of_action": [
    "Pharmacokinetics: Paralysis occurs in 45sec-2min and generally lasts 4-6min",
    "Causes flaccid paralysis following fasciculations"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "1-2 mg/kg IV/IO"
    },
    {
     "who": "Pediatric",
     "t": "1-2 mg/kg IV/IO"
    }
   ],
   "indications": [
    "To achieve paralysis to facilitate endotracheal intubation per RSI protocol"
   ],
   "contraindications": [
    "Conditions causing pathologic hyperkalemia (burns/spinal cord injury 1wk-6mo old",
    "Known neuromuscular disease",
    "Caution in chronic renal failure on hemodialysis with suspected hyperkalemia)",
    "History of malignant hyperthermia",
    "Rhabdomyolysis",
    "Inability to ventilate via BVM",
    "Known hypersensitivity"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Bradycardia",
    "Pressor response"
   ],
   "special_considerations": []
  },
  "tranexamicacid": {
   "name": "Tranexamic Acid",
   "alias": "TXA",
   "module": 6,
   "classification": [
    "Anti-Fibrinolytic"
   ],
   "mechanism_of_action": [
    "Inhibits both plasminogen activation and plasmin activity, thus preventing clot break-down rather than promoting new clot formation"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "1-2gm/100ml NS over 10 min"
    },
    {
     "who": "Adult",
     "t": "If transport delayed: 2nd 1gm over 8 hr"
    },
    {
     "who": "Pediatric",
     "t": "None currently recommended"
    }
   ],
   "indications": [
    "Significant traumatic injury with evidence of severe bleeding",
    "Sustained HR >110 or BP <90 systolic within 3 hours of injury"
   ],
   "contraindications": [
    "Patients with significant closed head injury"
   ],
   "precautions": [
    "Infuse within 3 hours of initial injury",
    "No IV push (hypotension)",
    "Not in same IV as Hextend/blood products"
   ],
   "side_adverse_effects": [
    "GI disturbance",
    "Visual disturbances"
   ],
   "special_considerations": []
  },
  "vecuronium": {
   "name": "Vecuronium",
   "alias": "Norcuron",
   "module": 6,
   "classification": [
    "Neuromuscular blocking agent (non-depolarizing)"
   ],
   "mechanism_of_action": [
    "Creates flaccid paralysis without fasciculations",
    "Paralysis occurs within 2-4 minutes and generally lasts 1-2 hours"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "Initial paralysis: 0.15 mg/kg IV/IO"
    },
    {
     "who": "Adult",
     "t": "Maintenance paralysis: 0.05-0.1 mg/kg IV/IO"
    }
   ],
   "indications": [
    "Treatment of ventilatory difficulty from bucking/combativeness in intubated patients",
    "Primary paralytic agent in place of succinylcholine in RSI"
   ],
   "contraindications": [
    "Known hypersensitivity",
    "Inability to ventilate patient via BVM"
   ],
   "precautions": [
    "Will cause cessation of spontaneous respirations, must be able to support patient's airway",
    "Administer 1 minute prior to rapid acting induction agent"
   ],
   "side_adverse_effects": [
    "Bradycardia",
    "Prolonged paralysis"
   ],
   "special_considerations": []
  },
  "hydroxocobalamin": {
   "name": "Hydroxocobalamin",
   "alias": "Cyanokit",
   "module": 6,
   "classification": [
    "Cyanide antidote"
   ],
   "mechanism_of_action": [
    "Acts as a scavenger and binds to cyanide. Hydroxocobalamin takes up the cyanide and transforms it into cyanocobalamin (Vitamin B12), which is then excreted in the urine."
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "5g IV over 15min, 2nd dose of 5g (total 10g) depending on severity"
    },
    {
     "who": "Pediatric",
     "t": "70mg/kg IV at 10-15ml/min, 2nd dose 70mg/kg (max 5g) depending on severity"
    }
   ],
   "indications": [
    "Cyanide poisoning meeting criteria in protocol"
   ],
   "contraindications": [
    "Known allergy"
   ],
   "precautions": [
    "Incompatible with other medications, use a dedicated line",
    "May redden injection site/skin/mucus membranes",
    "Breastfeeding must stop"
   ],
   "side_adverse_effects": [
    "Transient chromaturia (red urine)",
    "Rash",
    "Nausea",
    "Injection site reactions"
   ],
   "special_considerations": [
    "Erythema",
    "Hypertension",
    "Headache"
   ]
  },
  "labetalol": {
   "name": "Labetalol",
   "alias": "",
   "module": 6,
   "classification": [
    "Beta-blocker"
   ],
   "mechanism_of_action": [],
   "dosage": [
    {
     "who": "Adult",
     "t": "5-20 mg over 2 min"
    },
    {
     "who": "Adult",
     "t": "Additional dose 40 mg over 2 min"
    },
    {
     "who": "Adult",
     "t": "Max 150 mg total"
    },
    {
     "who": "Pediatric",
     "t": "Not indicated"
    }
   ],
   "indications": [
    "Acute management of hypertensive crisis"
   ],
   "contraindications": [
    "Known sensitivity",
    "Bradycardia",
    "Cardiogenic shock"
   ],
   "precautions": [
    "May mask symptoms of hypoglycemia",
    "Be alert for CHF, bradycardia, shock, heart block, or bronchospasm"
   ],
   "side_adverse_effects": [
    "Symptomatic orthostatic hypotension",
    "Dyspnea",
    "Bradycardia",
    "Fatigue",
    "Hypotension"
   ],
   "special_considerations": []
  },
  "pralidoxime": {
   "name": "Pralidoxime Chloride",
   "alias": "2 Pam Cl, Protopam",
   "module": 6,
   "classification": [
    "Cholinesterase reactivator"
   ],
   "mechanism_of_action": [
    "Reactivates acetylcholinesterase which degrades acetylcholine, decreasing parasympathetic activity"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "600mg IM, repeat q15min max 3 times"
    },
    {
     "who": "Pediatric",
     "t": "(<20kg): 20mg/kg IM, no repeat dose"
    }
   ],
   "indications": [
    "Organophosphate/nerve agent poisoning after Atropine",
    "Used with Atropine in MARK 1 auto injector",
    "Anti-cholinesterase Overdose"
   ],
   "contraindications": [
    "Not significant for above indications"
   ],
   "precautions": [],
   "side_adverse_effects": [
    "Tachycardia",
    "Palpitations",
    "Nausea"
   ],
   "special_considerations": [
    "Vomiting"
   ]
  },
  "salinenebulized": {
   "name": "Saline Nebulized",
   "alias": "",
   "module": 6,
   "classification": [
    "Isotonic crystalloid"
   ],
   "mechanism_of_action": [
    "Increases moisture content in the airway"
   ],
   "dosage": [
    {
     "who": "Adult",
     "t": "3ml via nebulizer"
    },
    {
     "who": "Pediatric",
     "t": "3ml via nebulizer"
    },
    {
     "who": "Pediatric",
     "t": "Follow local protocol"
    }
   ],
   "indications": [
    "Loosens thick secretions obstructing the lower airways",
    "Introduces moisture into lower airways via in-line nebulizer prior to/during suctioning of an obstructed ET tube",
    "Suspected croup"
   ],
   "contraindications": [
    "History of airway hyper responsiveness"
   ],
   "precautions": [
    "Monitor for dyspnea, restlessness, respiratory rate, respiratory pattern, accessory muscle use"
   ],
   "side_adverse_effects": [
    "Wheezing",
    "Bronchospasm"
   ],
   "special_considerations": []
  }
 },
 "rhythms": {
  "nsr": {
   "note": "Normal rhythm — no antiarrhythmic indicated. Treat the patient’s complaint, not the monitor.",
   "drugIndicated": false,
   "drugs": []
  },
  "sbrady": {
   "note": "Only if symptomatic (hypotension, AMS, chest pain, shock, acute HF). Asymptomatic sinus brady → monitor.",
   "drugIndicated": true,
   "also": [
    "Transcutaneous pacing (TCP) if unstable or atropine fails",
    "Look for cause: hypoxia, MI, meds (beta/CCB/digoxin), hypothermia, ↑ICP",
    "Hypothermia: bradycardia may be physiologic — rewarm first; pacing usually not indicated unless it persists after rewarming (AHA)"
   ],
   "drugs": [
    {
     "drug": "atropine",
     "role": "first",
     "why": "Symptomatic bradycardia — blocks vagal tone so the SA/AV node fires and conducts faster. (Current AHA ACLS: 1 mg q3–5 min, max 3 mg.)",
     "doseMatch": "q3-5min, max 3 mg|0\\.02 mg\\/kg",
     "administer": {
      "label": "Atropine 1 mg IV",
      "fx": "Vagolytic: SA rate and AV conduction speed up within 1–2 min.",
      "to": "nsr",
      "toTxt": "rate rises → sinus ~70s"
     }
    },
    {
     "drug": "epinephrine",
     "role": "next",
     "why": "Atropine ineffective: beta-1 drip raises rate and contractility (chronotropy/inotropy).",
     "doseMatch": "^Bradycardia",
     "administer": {
      "label": "Epi drip 2–10 mcg/min",
      "fx": "Beta-1: rate and contractility titrate up.",
      "to": "nsr",
      "toTxt": "rate titrated up → sinus"
     }
    },
    {
     "drug": "dopamine",
     "role": "next",
     "why": "Alternative pressor/chronotrope after atropine (your list: “Symptomatic bradycardia (after Atropine)”).",
     "doseMatch": "-20 mcg",
     "administer": {
      "label": "Dopamine 5 mcg/kg/min",
      "fx": "Moderate-dose beta-1 effect: rate and BP rise."
     }
    },
    {
     "drug": "glucagon",
     "role": "cond",
     "why": "Only if beta-blocker overdose is suspected and atropine fails.",
     "doseMatch": "Beta\\/Ca"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "Only if calcium-channel-blocker overdose or hyperkalemia is suspected.",
     "doseMatch": "2-4 g|20 mg\\/kg"
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "Sedation before transcutaneous pacing (your list: “Sedation prior to TCP/cardioversion”).",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    },
    {
     "drug": "lidocaine",
     "role": "avoid",
     "why": "Your list contraindicates it in “Sinus bradycardia/arrest/block”."
    }
   ]
  },
  "stach": {
   "note": "No antiarrhythmic — sinus tach is a response. Treat the cause (pain, fever, hypovolemia, hypoxia, anxiety, sepsis).",
   "drugIndicated": false,
   "also": [
    "Fluids for hypovolemia, O₂ for hypoxia, analgesia for pain — per protocol"
   ],
   "drugs": [
    {
     "drug": "adenosine",
     "role": "avoid",
     "why": "Sinus tach is not a re-entry rhythm; adenosine only causes a brief slowing then it returns."
    },
    {
     "drug": "metoprolol",
     "role": "avoid",
     "why": "Don’t rate-control a compensatory tachycardia — it can drop cardiac output (your list: SBP <90 / shock = contraindicated)."
    }
   ]
  },
  "sarrhythmia": {
   "note": "Normal variant (breathing-related). No drug indicated.",
   "drugIndicated": false,
   "drugs": []
  },
  "sarrest": {
   "note": "Treat like symptomatic bradycardia only if pauses cause symptoms.",
   "drugIndicated": true,
   "also": [
    "TCP if unstable"
   ],
   "drugs": [
    {
     "drug": "atropine",
     "role": "first",
     "why": "Symptomatic bradycardia — blocks vagal tone so the SA/AV node fires and conducts faster. (Current AHA ACLS: 1 mg q3–5 min, max 3 mg.)",
     "doseMatch": "q3-5min, max 3 mg|0\\.02 mg\\/kg",
     "administer": {
      "label": "Atropine 1 mg IV",
      "fx": "Vagolytic: SA rate and AV conduction speed up within 1–2 min.",
      "to": "nsr",
      "toTxt": "rate rises → sinus ~70s"
     }
    },
    {
     "drug": "epinephrine",
     "role": "next",
     "why": "Atropine ineffective: beta-1 drip raises rate and contractility (chronotropy/inotropy).",
     "doseMatch": "^Bradycardia",
     "administer": {
      "label": "Epi drip 2–10 mcg/min",
      "fx": "Beta-1: rate and contractility titrate up.",
      "to": "nsr",
      "toTxt": "rate titrated up → sinus"
     }
    },
    {
     "drug": "dopamine",
     "role": "next",
     "why": "Alternative pressor/chronotrope after atropine (your list: “Symptomatic bradycardia (after Atropine)”).",
     "doseMatch": "-20 mcg",
     "administer": {
      "label": "Dopamine 5 mcg/kg/min",
      "fx": "Moderate-dose beta-1 effect: rate and BP rise."
     }
    },
    {
     "drug": "glucagon",
     "role": "cond",
     "why": "Only if beta-blocker overdose is suspected and atropine fails.",
     "doseMatch": "Beta\\/Ca"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "Only if calcium-channel-blocker overdose or hyperkalemia is suspected.",
     "doseMatch": "2-4 g|20 mg\\/kg"
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "Sedation before transcutaneous pacing (your list: “Sedation prior to TCP/cardioversion”).",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    },
    {
     "drug": "lidocaine",
     "role": "avoid",
     "why": "Your list contraindicates it in “Sinus bradycardia/arrest/block”."
    }
   ]
  },
  "sexit": {
   "note": "Treat like symptomatic bradycardia only if the dropped beats cause symptoms.",
   "drugIndicated": true,
   "also": [
    "TCP if unstable"
   ],
   "drugs": [
    {
     "drug": "atropine",
     "role": "first",
     "why": "Symptomatic bradycardia — blocks vagal tone so the SA/AV node fires and conducts faster. (Current AHA ACLS: 1 mg q3–5 min, max 3 mg.)",
     "doseMatch": "q3-5min, max 3 mg|0\\.02 mg\\/kg",
     "administer": {
      "label": "Atropine 1 mg IV",
      "fx": "Vagolytic: SA rate and AV conduction speed up within 1–2 min.",
      "to": "nsr",
      "toTxt": "rate rises → sinus ~70s"
     }
    },
    {
     "drug": "epinephrine",
     "role": "next",
     "why": "Atropine ineffective: beta-1 drip raises rate and contractility (chronotropy/inotropy).",
     "doseMatch": "^Bradycardia",
     "administer": {
      "label": "Epi drip 2–10 mcg/min",
      "fx": "Beta-1: rate and contractility titrate up.",
      "to": "nsr",
      "toTxt": "rate titrated up → sinus"
     }
    },
    {
     "drug": "dopamine",
     "role": "next",
     "why": "Alternative pressor/chronotrope after atropine (your list: “Symptomatic bradycardia (after Atropine)”).",
     "doseMatch": "-20 mcg",
     "administer": {
      "label": "Dopamine 5 mcg/kg/min",
      "fx": "Moderate-dose beta-1 effect: rate and BP rise."
     }
    },
    {
     "drug": "glucagon",
     "role": "cond",
     "why": "Only if beta-blocker overdose is suspected and atropine fails.",
     "doseMatch": "Beta\\/Ca"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "Only if calcium-channel-blocker overdose or hyperkalemia is suspected.",
     "doseMatch": "2-4 g|20 mg\\/kg"
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "Sedation before transcutaneous pacing (your list: “Sedation prior to TCP/cardioversion”).",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    },
    {
     "drug": "lidocaine",
     "role": "avoid",
     "why": "Your list contraindicates it in “Sinus bradycardia/arrest/block”."
    }
   ]
  },
  "pac": {
   "note": "Usually benign. No drug — look for triggers (caffeine, stimulants, hypoxia, electrolytes).",
   "drugIndicated": false,
   "drugs": []
  },
  "wap": {
   "note": "Usually benign. No drug indicated.",
   "drugIndicated": false,
   "drugs": []
  },
  "mat": {
   "note": "No specific antiarrhythmic from the box — treat the underlying lung disease / hypoxia.",
   "drugIndicated": false,
   "also": [
    "O₂ / treat bronchospasm per protocol"
   ],
   "drugs": [
    {
     "drug": "adenosine",
     "role": "avoid",
     "why": "MAT is not re-entry; adenosine won’t convert it."
    },
    {
     "drug": "metoprolol",
     "role": "avoid",
     "why": "MAT is common in COPD — your list contraindicates metoprolol in asthma attack / COPD exacerbation."
    }
   ]
  },
  "afib": {
   "note": "Controlled ventricular rate (<110) — rate-control drugs are not needed. Your list starts diltiazem/metoprolol only at sustained rates >120.",
   "drugIndicated": false,
   "drugs": [
    {
     "drug": "adenosine",
     "role": "avoid",
     "why": "Your list: contraindicated in confirmed AFib."
    },
    {
     "drug": "atropine",
     "role": "avoid",
     "why": "Your list: contraindicated in AFib (faster conduction can speed the ventricles)."
    }
   ]
  },
  "afrvr": {
   "note": "Stable with sustained rate >120. Unstable → synchronized cardioversion.",
   "drugIndicated": true,
   "also": [
    "Synchronized cardioversion if unstable"
   ],
   "drugs": [
    {
     "drug": "diltiazem",
     "role": "first",
     "why": "Calcium-channel blocker slows AV-node conduction → fewer impulses reach the ventricles (your list: AFib/Aflutter with sustained rate >120).",
     "doseMatch": ".",
     "administer": {
      "label": "Diltiazem 0.25 mg/kg IV over 5 min",
      "fx": "AV node slows; ventricular rate falls below ~110 within minutes. Atrial rhythm itself is unchanged.",
      "to": "afib",
      "toTxt": "rate controlled → AFib <110"
     }
    },
    {
     "drug": "metoprolol",
     "role": "next",
     "why": "Beta blocker alternative for rate control (your list: Afib/Aflutter with sustained ventricular rate >120). Watch SBP.",
     "doseMatch": ".",
     "administer": {
      "label": "Metoprolol 5 mg slow IV",
      "fx": "Beta blockade slows AV conduction; rate falls.",
      "to": "afib",
      "toTxt": "rate controlled → AFib <110"
     }
    },
    {
     "drug": "verapamil",
     "role": "next",
     "why": "Calcium-channel blocker alternative (your list: stable, uncontrolled Aflutter/Afib with RVR).",
     "doseMatch": ".",
     "administer": {
      "label": "Verapamil 2.5–5 mg IV",
      "fx": "AV node slows; rate falls.",
      "to": "afib",
      "toTxt": "rate controlled → AFib <110"
     }
    },
    {
     "drug": "amiodarone",
     "role": "cond",
     "why": "Refractory cases only (your list: “Refractory SVT including AFib/Aflutter”). Med control.",
     "doseMatch": "with a pulse"
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "If unstable → synchronized cardioversion; sedate first when BP allows.",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    },
    {
     "drug": "adenosine",
     "role": "avoid",
     "why": "Your list contraindicates it in confirmed AFib/Aflutter — only briefly slows the rate and can unmask flutter waves."
    },
    {
     "drug": "atropine",
     "role": "avoid",
     "why": "Your list: contraindicated where faster conduction may accelerate the ventricular rate (AFib, Aflutter)."
    }
   ]
  },
  "flutter": {
   "note": "Rate control when the ventricular rate is sustained >120 (e.g. 2:1 at ~150). At 4:1 (~75) no drug is usually needed.",
   "drugIndicated": true,
   "also": [
    "Synchronized cardioversion if unstable"
   ],
   "drugs": [
    {
     "drug": "diltiazem",
     "role": "first",
     "why": "Calcium-channel blocker slows AV-node conduction → fewer impulses reach the ventricles (your list: AFib/Aflutter with sustained rate >120).",
     "doseMatch": ".",
     "administer": {
      "label": "Diltiazem 0.25 mg/kg IV over 5 min",
      "fx": "AV node slows; ventricular rate falls below ~110 within minutes. Atrial rhythm itself is unchanged.",
      "to": "flutter",
      "toV": "4:1",
      "toTxt": "AV block ↑ → 4:1 flutter ~75"
     }
    },
    {
     "drug": "metoprolol",
     "role": "next",
     "why": "Beta blocker alternative for rate control (your list: Afib/Aflutter with sustained ventricular rate >120). Watch SBP.",
     "doseMatch": ".",
     "administer": {
      "label": "Metoprolol 5 mg slow IV",
      "fx": "Beta blockade slows AV conduction; rate falls.",
      "to": "flutter",
      "toV": "4:1",
      "toTxt": "AV block ↑ → 4:1 flutter ~75"
     }
    },
    {
     "drug": "verapamil",
     "role": "next",
     "why": "Calcium-channel blocker alternative (your list: stable, uncontrolled Aflutter/Afib with RVR).",
     "doseMatch": ".",
     "administer": {
      "label": "Verapamil 2.5–5 mg IV",
      "fx": "AV node slows; rate falls.",
      "to": "flutter",
      "toV": "4:1",
      "toTxt": "AV block ↑ → 4:1 flutter ~75"
     }
    },
    {
     "drug": "amiodarone",
     "role": "cond",
     "why": "Refractory cases only (your list: “Refractory SVT including AFib/Aflutter”). Med control.",
     "doseMatch": "with a pulse"
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "If unstable → synchronized cardioversion; sedate first when BP allows.",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    },
    {
     "drug": "adenosine",
     "role": "avoid",
     "why": "Your list contraindicates it in confirmed AFib/Aflutter — only briefly slows the rate and can unmask flutter waves."
    },
    {
     "drug": "atropine",
     "role": "avoid",
     "why": "Your list: contraindicated where faster conduction may accelerate the ventricular rate (AFib, Aflutter)."
    }
   ]
  },
  "svt": {
   "note": "Stable narrow, regular tachycardia. Try vagal maneuvers first. Unstable → synchronized cardioversion.",
   "drugIndicated": true,
   "also": [
    "Vagal maneuvers (modified Valsalva) first",
    "Synchronized cardioversion if unstable"
   ],
   "drugs": [
    {
     "drug": "adenosine",
     "role": "first",
     "why": "Briefly blocks the AV node and breaks the re-entry circuit (your list: SVT/PSVT).",
     "doseMatch": ".",
     "administer": {
      "label": "Adenosine 6 mg rapid IV push + flush",
      "fx": "Brief AV block — be ready for up to 40 sec of asystole — then sinus resumes.",
      "to": "nsr",
      "toTxt": "re-entry broken → sinus",
      "delay": 3500
     }
    },
    {
     "drug": "diltiazem",
     "role": "next",
     "why": "2nd-line for stable narrow-complex tachycardia (your list).",
     "doseMatch": ".",
     "administer": {
      "label": "Diltiazem 0.25 mg/kg IV over 5 min",
      "fx": "Slows AV node; may terminate re-entry or slow the rate.",
      "to": "nsr",
      "toTxt": "converted → sinus"
     }
    },
    {
     "drug": "verapamil",
     "role": "next",
     "why": "2nd-line for stable PSVT/SVT (your list).",
     "doseMatch": "."
    },
    {
     "drug": "metoprolol",
     "role": "next",
     "why": "Refractory PSVT/SVT (your list).",
     "doseMatch": "."
    },
    {
     "drug": "amiodarone",
     "role": "cond",
     "why": "Refractory SVT (your list) — med control.",
     "doseMatch": "with a pulse"
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "Sedation before synchronized cardioversion if unstable and BP allows.",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    }
   ]
  },
  "pjc": {
   "note": "Usually benign. No drug indicated.",
   "drugIndicated": false,
   "drugs": []
  },
  "jxesc": {
   "note": "Escape rhythm — only treat if symptomatic (as bradycardia).",
   "drugIndicated": true,
   "also": [
    "TCP if unstable"
   ],
   "drugs": [
    {
     "drug": "atropine",
     "role": "first",
     "why": "Symptomatic bradycardia — blocks vagal tone so the SA/AV node fires and conducts faster. (Current AHA ACLS: 1 mg q3–5 min, max 3 mg.)",
     "doseMatch": "q3-5min, max 3 mg|0\\.02 mg\\/kg",
     "administer": {
      "label": "Atropine 1 mg IV",
      "fx": "Vagolytic: SA rate and AV conduction speed up within 1–2 min.",
      "to": "nsr",
      "toTxt": "rate rises → sinus ~70s"
     }
    },
    {
     "drug": "epinephrine",
     "role": "next",
     "why": "Atropine ineffective: beta-1 drip raises rate and contractility (chronotropy/inotropy).",
     "doseMatch": "^Bradycardia",
     "administer": {
      "label": "Epi drip 2–10 mcg/min",
      "fx": "Beta-1: rate and contractility titrate up.",
      "to": "nsr",
      "toTxt": "rate titrated up → sinus"
     }
    },
    {
     "drug": "dopamine",
     "role": "next",
     "why": "Alternative pressor/chronotrope after atropine (your list: “Symptomatic bradycardia (after Atropine)”).",
     "doseMatch": "-20 mcg",
     "administer": {
      "label": "Dopamine 5 mcg/kg/min",
      "fx": "Moderate-dose beta-1 effect: rate and BP rise."
     }
    },
    {
     "drug": "glucagon",
     "role": "cond",
     "why": "Only if beta-blocker overdose is suspected and atropine fails.",
     "doseMatch": "Beta\\/Ca"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "Only if calcium-channel-blocker overdose or hyperkalemia is suspected.",
     "doseMatch": "2-4 g|20 mg\\/kg"
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "Sedation before transcutaneous pacing (your list: “Sedation prior to TCP/cardioversion”).",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    },
    {
     "drug": "lidocaine",
     "role": "avoid",
     "why": "Never suppress an escape rhythm — it is the backup pacemaker."
    }
   ]
  },
  "accjx": {
   "note": "No drug from the box — think digoxin toxicity, ischemia, or post-op. Treat the cause. Suspected digoxin toxicity → med control / Fab at hospital; avoid calcium.",
   "drugIndicated": false,
   "drugs": []
  },
  "jxtach": {
   "note": "Uncommon prehospital; often digoxin toxicity or ischemia. Consult med control.",
   "drugIndicated": true,
   "drugs": [
    {
     "drug": "amiodarone",
     "role": "cond",
     "why": "Refractory narrow-complex tachycardia — med control (your list: refractory SVT).",
     "doseMatch": "with a pulse"
    },
    {
     "drug": "adenosine",
     "role": "avoid",
     "why": "Automatic (not re-entry) junctional focus — adenosine usually won’t convert it."
    },
    {
     "drug": "calciumchloride",
     "role": "avoid",
     "why": "Your list: contraindicated in a digoxin patient (suspected Ca-channel overdose) — junctional tach is classically digoxin toxicity."
    }
   ],
   "also": [
    "Suspected digoxin toxicity: monitor, 12-lead, check K⁺ at hospital; early hospital notification"
   ]
  },
  "pvc": {
   "note": "Usually no drug — treat the cause (hypoxia, ischemia, electrolytes, stimulants).",
   "drugIndicated": true,
   "drugs": [
    {
     "drug": "lidocaine",
     "role": "cond",
     "why": "Only for malignant PVCs (your list: “Reduce malignant PVCs”) — med control.",
     "doseMatch": "W\\/ pulse"
    }
   ]
  },
  "ufpvc": {
   "note": "Usually no drug — treat the cause (hypoxia, ischemia, electrolytes, stimulants).",
   "drugIndicated": true,
   "drugs": [
    {
     "drug": "lidocaine",
     "role": "cond",
     "why": "Only for malignant PVCs (your list: “Reduce malignant PVCs”) — med control.",
     "doseMatch": "W\\/ pulse"
    }
   ]
  },
  "mfpvc": {
   "note": "Usually no drug — treat the cause (hypoxia, ischemia, electrolytes, stimulants).",
   "drugIndicated": true,
   "drugs": [
    {
     "drug": "lidocaine",
     "role": "cond",
     "why": "Only for malignant PVCs (your list: “Reduce malignant PVCs”) — med control.",
     "doseMatch": "W\\/ pulse"
    }
   ]
  },
  "bigeminy": {
   "note": "Usually no drug — treat the cause (hypoxia, ischemia, electrolytes, stimulants). Bigeminy in a patient on digoxin → think digoxin toxicity (see jxtach).",
   "drugIndicated": true,
   "drugs": [
    {
     "drug": "lidocaine",
     "role": "cond",
     "why": "Only for malignant PVCs (your list: “Reduce malignant PVCs”) — med control.",
     "doseMatch": "W\\/ pulse"
    }
   ]
  },
  "ivr": {
   "note": "Escape rhythm — check a pulse! With a pulse and symptoms, treat as bradycardia and pace. No pulse = PEA.",
   "drugIndicated": true,
   "noConvert": true,
   "also": [
    "TCP if symptomatic"
   ],
   "drugs": [
    {
     "drug": "atropine",
     "role": "first",
     "why": "May try for symptomatic bradycardia, but often ineffective — the pacemaker is ventricular, below the AV node.",
     "doseMatch": "q3-5min, max 3 mg|0\\.02 mg\\/kg",
     "administer": {
      "label": "Atropine 1 mg IV",
      "fx": "Usually little effect on a ventricular escape focus — move to pacing."
     }
    },
    {
     "drug": "epinephrine",
     "role": "next",
     "why": "Atropine ineffective: beta-1 drip raises rate and contractility (chronotropy/inotropy).",
     "doseMatch": "^Bradycardia",
     "administer": {
      "label": "Epi drip 2–10 mcg/min",
      "fx": "Beta-1: rate and contractility titrate up.",
      "to": "nsr",
      "toTxt": "rate titrated up → sinus"
     }
    },
    {
     "drug": "dopamine",
     "role": "next",
     "why": "Alternative pressor/chronotrope after atropine (your list: “Symptomatic bradycardia (after Atropine)”).",
     "doseMatch": "-20 mcg",
     "administer": {
      "label": "Dopamine 5 mcg/kg/min",
      "fx": "Moderate-dose beta-1 effect: rate and BP rise."
     }
    },
    {
     "drug": "glucagon",
     "role": "cond",
     "why": "Only if beta-blocker overdose is suspected and atropine fails.",
     "doseMatch": "Beta\\/Ca"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "Only if calcium-channel-blocker overdose or hyperkalemia is suspected.",
     "doseMatch": "2-4 g|20 mg\\/kg"
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "Sedation before transcutaneous pacing (your list: “Sedation prior to TCP/cardioversion”).",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    },
    {
     "drug": "lidocaine",
     "role": "avoid",
     "why": "Your list contraindicates it in idioventricular escape rhythms."
    },
    {
     "drug": "amiodarone",
     "role": "avoid",
     "why": "Would suppress the only pacemaker left."
    }
   ]
  },
  "aivr": {
   "note": "Usually benign and self-limiting (common after reperfusion). No antiarrhythmic.",
   "drugIndicated": false,
   "drugs": [
    {
     "drug": "lidocaine",
     "role": "avoid",
     "why": "Your list contraindicates it in AIVR."
    },
    {
     "drug": "amiodarone",
     "role": "avoid",
     "why": "Suppressing AIVR can leave no pacemaker at all."
    }
   ]
  },
  "vt": {
   "note": "Monomorphic VT WITH a pulse, stable. Unstable → synchronized cardioversion. No pulse → VF/pVT algorithm.",
   "drugIndicated": true,
   "also": [
    "Synchronized cardioversion if unstable",
    "Pulseless → defibrillate (see Pulseless VT)"
   ],
   "drugs": [
    {
     "drug": "amiodarone",
     "role": "first",
     "why": "Antiarrhythmic for stable VT with a pulse.",
     "doseMatch": "with a pulse",
     "administer": {
      "label": "Amiodarone 150 mg IV over 10 min",
      "fx": "Prolongs refractory period, slows conduction through His–Purkinje. Simulated: converts.",
      "to": "nsr",
      "toTxt": "converted → sinus",
      "delay": 4000
     }
    },
    {
     "drug": "lidocaine",
     "role": "next",
     "why": "Alternative antiarrhythmic (your list: 2nd to Amiodarone in adults).",
     "doseMatch": "W\\/ pulse|^1mg\\/kg",
     "administer": {
      "label": "Lidocaine 1 mg/kg slow IV",
      "fx": "Stabilizes ventricular cell membranes.",
      "to": "nsr",
      "toTxt": "converted → sinus",
      "delay": 4000
     }
    },
    {
     "drug": "adenosine",
     "role": "cond",
     "why": "Only for a REGULAR, monomorphic wide-complex tachycardia of unknown origin (your list: diagnostic). Contraindicated once VT is confirmed.",
     "doseMatch": "."
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "Sedation before synchronized cardioversion if BP allows.",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    },
    {
     "drug": "diltiazem",
     "role": "avoid",
     "why": "Your list contraindicates it in VT — can cause collapse."
    },
    {
     "drug": "verapamil",
     "role": "avoid",
     "why": "Your list contraindicates it in VT."
    }
   ]
  },
  "torsades": {
   "note": "Polymorphic VT with long QT. With a pulse → magnesium. Pulseless → defibrillate + magnesium.",
   "drugIndicated": true,
   "also": [
    "Defibrillate (unsynchronized) if pulseless or unstable"
   ],
   "drugs": [
    {
     "drug": "magnesium",
     "role": "first",
     "why": "Stabilizes the myocardium and shortens the triggering after-depolarizations (your list: Torsades des Pointes).",
     "doseMatch": "TdP",
     "administer": {
      "label": "Magnesium 2 g IV over 10 min",
      "fx": "Suppresses early after-depolarizations; torsades breaks.",
      "to": "nsr",
      "toTxt": "torsades breaks → sinus",
      "delay": 4000
     }
    },
    {
     "drug": "epinephrine",
     "role": "cond",
     "why": "Only if pulseless (cardiac-arrest dosing).",
     "doseMatch": "^Cardiac Arrest"
    },
    {
     "drug": "amiodarone",
     "role": "avoid",
     "why": "Prolongs the QT/refractory period further — can worsen torsades. Med control."
    }
   ]
  },
  "avb1": {
   "note": "Usually benign. No drug — watch for progression.",
   "drugIndicated": false,
   "drugs": []
  },
  "mobitz1": {
   "note": "Usually benign (AV-node level). Only treat if symptomatic.",
   "drugIndicated": true,
   "also": [
    "TCP if unstable"
   ],
   "drugs": [
    {
     "drug": "atropine",
     "role": "first",
     "why": "Works well here — Wenckebach is usually at the AV node, where atropine acts.",
     "doseMatch": "q3-5min, max 3 mg|0\\.02 mg\\/kg",
     "administer": {
      "label": "Atropine 1 mg IV",
      "fx": "Vagolytic: SA rate and AV conduction speed up within 1–2 min.",
      "to": "nsr",
      "toTxt": "rate rises → sinus ~70s"
     }
    },
    {
     "drug": "epinephrine",
     "role": "next",
     "why": "Atropine ineffective: beta-1 drip raises rate and contractility (chronotropy/inotropy).",
     "doseMatch": "^Bradycardia",
     "administer": {
      "label": "Epi drip 2–10 mcg/min",
      "fx": "Beta-1: rate and contractility titrate up.",
      "to": "nsr",
      "toTxt": "rate titrated up → sinus"
     }
    },
    {
     "drug": "dopamine",
     "role": "next",
     "why": "Alternative pressor/chronotrope after atropine (your list: “Symptomatic bradycardia (after Atropine)”).",
     "doseMatch": "-20 mcg",
     "administer": {
      "label": "Dopamine 5 mcg/kg/min",
      "fx": "Moderate-dose beta-1 effect: rate and BP rise."
     }
    },
    {
     "drug": "lidocaine",
     "role": "avoid",
     "why": "Your list contraindicates it in AV blocks — it can wipe out the ventricular escape that is keeping the patient alive."
    },
    {
     "drug": "diltiazem",
     "role": "avoid",
     "why": "Your list: contraindicated in high-degree heart block — slows the AV node further."
    },
    {
     "drug": "metoprolol",
     "role": "avoid",
     "why": "Your list: contraindicated in 2nd/3rd-degree AV block."
    },
    {
     "drug": "verapamil",
     "role": "avoid",
     "why": "Your list: contraindicated in high-degree heart block."
    }
   ]
  },
  "mobitz2": {
   "note": "Infranodal and unstable-prone. Prepare to pace — atropine may not work.",
   "drugIndicated": true,
   "noConvert": true,
   "also": [
    "Transcutaneous pacing — primary treatment if symptomatic"
   ],
   "drugs": [
    {
     "drug": "atropine",
     "role": "next",
     "why": "May try while preparing TCP, but often ineffective — the block is below the AV node.",
     "doseMatch": "q3-5min, max 3 mg|0\\.02 mg\\/kg",
     "administer": {
      "label": "Atropine 1 mg IV",
      "fx": "Little or no effect expected — block is infranodal. Move to TCP."
     }
    },
    {
     "drug": "epinephrine",
     "role": "next",
     "why": "Atropine ineffective: beta-1 drip raises rate and contractility (chronotropy/inotropy).",
     "doseMatch": "^Bradycardia",
     "administer": {
      "label": "Epi drip 2–10 mcg/min",
      "fx": "Beta-1: rate and contractility titrate up.",
      "to": "nsr",
      "toTxt": "rate titrated up → sinus"
     }
    },
    {
     "drug": "dopamine",
     "role": "next",
     "why": "Alternative pressor/chronotrope after atropine (your list: “Symptomatic bradycardia (after Atropine)”).",
     "doseMatch": "-20 mcg",
     "administer": {
      "label": "Dopamine 5 mcg/kg/min",
      "fx": "Moderate-dose beta-1 effect: rate and BP rise."
     }
    },
    {
     "drug": "glucagon",
     "role": "cond",
     "why": "Only if beta-blocker overdose is suspected and atropine fails.",
     "doseMatch": "Beta\\/Ca"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "Only if calcium-channel-blocker overdose or hyperkalemia is suspected.",
     "doseMatch": "2-4 g|20 mg\\/kg"
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "Sedation before transcutaneous pacing (your list: “Sedation prior to TCP/cardioversion”).",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    },
    {
     "drug": "amiodarone",
     "role": "avoid",
     "why": "Your list contraindicates it in “High degree heart block (2nd Type II and 3rd)”."
    },
    {
     "drug": "lidocaine",
     "role": "avoid",
     "why": "Your list contraindicates it in AV blocks — it can wipe out the ventricular escape that is keeping the patient alive."
    },
    {
     "drug": "diltiazem",
     "role": "avoid",
     "why": "Your list: contraindicated in high-degree heart block — slows the AV node further."
    },
    {
     "drug": "metoprolol",
     "role": "avoid",
     "why": "Your list: contraindicated in 2nd/3rd-degree AV block."
    },
    {
     "drug": "verapamil",
     "role": "avoid",
     "why": "Your list: contraindicated in high-degree heart block."
    }
   ]
  },
  "avb3": {
   "note": "Complete block. Pace if symptomatic; atropine may help a narrow junctional escape but rarely a wide one.",
   "drugIndicated": true,
   "noConvert": true,
   "also": [
    "Transcutaneous pacing — primary treatment if symptomatic"
   ],
   "drugs": [
    {
     "drug": "atropine",
     "role": "next",
     "why": "May help a narrow (junctional) escape; usually ineffective with a wide ventricular escape. Don’t delay pacing.",
     "doseMatch": "q3-5min, max 3 mg|0\\.02 mg\\/kg",
     "administer": {
      "label": "Atropine 1 mg IV",
      "fx": "Little or no effect expected on complete heart block — move to TCP."
     }
    },
    {
     "drug": "epinephrine",
     "role": "next",
     "why": "Atropine ineffective: beta-1 drip raises rate and contractility (chronotropy/inotropy).",
     "doseMatch": "^Bradycardia",
     "administer": {
      "label": "Epi drip 2–10 mcg/min",
      "fx": "Beta-1: rate and contractility titrate up.",
      "to": "nsr",
      "toTxt": "rate titrated up → sinus"
     }
    },
    {
     "drug": "dopamine",
     "role": "next",
     "why": "Alternative pressor/chronotrope after atropine (your list: “Symptomatic bradycardia (after Atropine)”).",
     "doseMatch": "-20 mcg",
     "administer": {
      "label": "Dopamine 5 mcg/kg/min",
      "fx": "Moderate-dose beta-1 effect: rate and BP rise."
     }
    },
    {
     "drug": "glucagon",
     "role": "cond",
     "why": "Only if beta-blocker overdose is suspected and atropine fails.",
     "doseMatch": "Beta\\/Ca"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "Only if calcium-channel-blocker overdose or hyperkalemia is suspected.",
     "doseMatch": "2-4 g|20 mg\\/kg"
    },
    {
     "drug": "midazolam",
     "role": "sed",
     "why": "Sedation before transcutaneous pacing (your list: “Sedation prior to TCP/cardioversion”).",
     "doseMatch": "1-5 mg|0\\.05-0\\.1"
    },
    {
     "drug": "amiodarone",
     "role": "avoid",
     "why": "Your list contraindicates it in “High degree heart block (2nd Type II and 3rd)”."
    },
    {
     "drug": "lidocaine",
     "role": "avoid",
     "why": "Your list contraindicates it in AV blocks — it can wipe out the ventricular escape that is keeping the patient alive."
    },
    {
     "drug": "diltiazem",
     "role": "avoid",
     "why": "Your list: contraindicated in high-degree heart block — slows the AV node further."
    },
    {
     "drug": "metoprolol",
     "role": "avoid",
     "why": "Your list: contraindicated in 2nd/3rd-degree AV block."
    },
    {
     "drug": "verapamil",
     "role": "avoid",
     "why": "Your list: contraindicated in high-degree heart block."
    }
   ]
  },
  "apaced": {
   "note": "Paced rhythm — no drug. Check for capture and a pulse.",
   "drugIndicated": false,
   "drugs": []
  },
  "vpaced": {
   "note": "Paced rhythm — no drug. Check for capture and a pulse.",
   "drugIndicated": false,
   "drugs": []
  },
  "vf": {
   "note": "CARDIAC ARREST — shockable. CPR + defibrillation come first; drugs support.",
   "drugIndicated": true,
   "also": [
    "High-quality CPR",
    "Defibrillate ASAP, then every 2 min",
    "After ROSC: SBP <90 / MAP <65 → 1–2 L fluid bolus, then vasopressor infusion (epi / dopamine); 12-lead, SpO₂ 92–98%, avoid hyperventilation",
    "Hypothermic VF: defibrillate; AHA — reasonable to follow standard ACLS drugs/shocks while actively rewarming (some protocols withhold meds <30 °C). Handle gently."
   ],
   "drugs": [
    {
     "drug": "epinephrine",
     "role": "first",
     "why": "Vasopressor: raises coronary/cerebral perfusion pressure during CPR. Given after the 2nd shock in shockable arrest.",
     "doseMatch": "^Cardiac Arrest",
     "administer": {
      "label": "Epinephrine 1 mg IV/IO (1:10,000)",
      "fx": "Raises perfusion pressure during CPR. Does NOT convert VF/VT by itself — the shock does. Repeat q3–5 min."
     }
    },
    {
     "drug": "amiodarone",
     "role": "first",
     "why": "Antiarrhythmic for VF / pulseless VT that persists after shocks (your list: 1st 300 mg, 2nd 150 mg).",
     "doseMatch": "pulseless VTach",
     "administer": {
      "label": "Amiodarone 300 mg IV/IO",
      "fx": "Raises the VF threshold so the next shock is more likely to hold. Simulated: next shock → ROSC.",
      "to": "nsr",
      "toTxt": "shock + CPR → ROSC (teaching sim)"
     }
    },
    {
     "drug": "lidocaine",
     "role": "next",
     "why": "Alternative antiarrhythmic if amiodarone is unavailable/ineffective (your list: 2nd to Amiodarone in adults); maintenance drip post-ROSC.",
     "doseMatch": "W\\/o pulse|^1mg\\/kg|post-ROSC",
     "administer": {
      "label": "Lidocaine 1–1.5 mg/kg IV/IO",
      "fx": "Stabilizes ventricular membranes; raises VF threshold."
     }
    },
    {
     "drug": "magnesium",
     "role": "cond",
     "why": "Only if torsades or suspected hypomagnesemia (your list: refractory VFib/pulseless VTach with suspected hypomagnesaemia).",
     "doseMatch": "w\\/o pulse"
    },
    {
     "drug": "sodiumbicarbonate",
     "role": "cond",
     "why": "H’s & T’s: hyperkalemia, TCA overdose, or prolonged arrest with acidosis — after more definitive treatments.",
     "doseMatch": "1 mEq\\/kg"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "H’s & T’s: suspected hyperkalemia, hypocalcemia, or calcium-channel-blocker toxicity (your list: otherwise not indicated in arrest).",
     "doseMatch": "Cardiac arrest|2-4 g|20 mg\\/kg"
    },
    {
     "drug": "dextrose",
     "role": "cond",
     "why": "H’s & T’s: correct documented hypoglycemia.",
     "doseMatch": "."
    }
   ]
  },
  "pvt": {
   "note": "CARDIAC ARREST — shockable. CPR + defibrillation come first; drugs support.",
   "drugIndicated": true,
   "also": [
    "High-quality CPR",
    "Defibrillate ASAP, then every 2 min",
    "After ROSC: SBP <90 / MAP <65 → 1–2 L fluid bolus, then vasopressor infusion (epi / dopamine); 12-lead, SpO₂ 92–98%, avoid hyperventilation",
    "Hypothermic arrest: defibrillate; AHA — reasonable to follow standard ACLS drugs/shocks while actively rewarming (some protocols withhold meds <30 °C)."
   ],
   "drugs": [
    {
     "drug": "epinephrine",
     "role": "first",
     "why": "Vasopressor: raises coronary/cerebral perfusion pressure during CPR. Given after the 2nd shock in shockable arrest.",
     "doseMatch": "^Cardiac Arrest",
     "administer": {
      "label": "Epinephrine 1 mg IV/IO (1:10,000)",
      "fx": "Raises perfusion pressure during CPR. Does NOT convert VF/VT by itself — the shock does. Repeat q3–5 min."
     }
    },
    {
     "drug": "amiodarone",
     "role": "first",
     "why": "Antiarrhythmic for VF / pulseless VT that persists after shocks (your list: 1st 300 mg, 2nd 150 mg).",
     "doseMatch": "pulseless VTach",
     "administer": {
      "label": "Amiodarone 300 mg IV/IO",
      "fx": "Raises the VF threshold so the next shock is more likely to hold. Simulated: next shock → ROSC.",
      "to": "nsr",
      "toTxt": "shock + CPR → ROSC (teaching sim)"
     }
    },
    {
     "drug": "lidocaine",
     "role": "next",
     "why": "Alternative antiarrhythmic if amiodarone is unavailable/ineffective (your list: 2nd to Amiodarone in adults); maintenance drip post-ROSC.",
     "doseMatch": "W\\/o pulse|^1mg\\/kg|post-ROSC",
     "administer": {
      "label": "Lidocaine 1–1.5 mg/kg IV/IO",
      "fx": "Stabilizes ventricular membranes; raises VF threshold."
     }
    },
    {
     "drug": "magnesium",
     "role": "cond",
     "why": "Only if torsades or suspected hypomagnesemia (your list: refractory VFib/pulseless VTach with suspected hypomagnesaemia).",
     "doseMatch": "w\\/o pulse"
    },
    {
     "drug": "sodiumbicarbonate",
     "role": "cond",
     "why": "H’s & T’s: hyperkalemia, TCA overdose, or prolonged arrest with acidosis — after more definitive treatments.",
     "doseMatch": "1 mEq\\/kg"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "H’s & T’s: suspected hyperkalemia, hypocalcemia, or calcium-channel-blocker toxicity (your list: otherwise not indicated in arrest).",
     "doseMatch": "Cardiac arrest|2-4 g|20 mg\\/kg"
    },
    {
     "drug": "dextrose",
     "role": "cond",
     "why": "H’s & T’s: correct documented hypoglycemia.",
     "doseMatch": "."
    }
   ]
  },
  "pea": {
   "note": "CARDIAC ARREST — non-shockable. CPR + epinephrine + find the cause (H’s & T’s).",
   "drugIndicated": true,
   "also": [
    "High-quality CPR",
    "Do NOT shock",
    "H’s & T’s (hypovolemia, hypoxia, H⁺, K⁺, hypothermia, tension pneumo, tamponade, toxins, thrombosis)",
    "After ROSC: SBP <90 / MAP <65 → 1–2 L fluid bolus, then vasopressor infusion (epi / dopamine); 12-lead, SpO₂ 92–98%, avoid hyperventilation"
   ],
   "drugs": [
    {
     "drug": "epinephrine",
     "role": "first",
     "why": "Give as soon as possible in non-shockable arrest, then q3–5 min with high-quality CPR.",
     "doseMatch": "^Cardiac Arrest",
     "administer": {
      "label": "Epinephrine 1 mg IV/IO (1:10,000)",
      "fx": "Raises perfusion pressure during CPR. Find and fix the reversible cause (H’s & T’s)."
     }
    },
    {
     "drug": "sodiumbicarbonate",
     "role": "cond",
     "why": "H’s & T’s: hyperkalemia, TCA overdose, or prolonged arrest with acidosis — after more definitive treatments.",
     "doseMatch": "1 mEq\\/kg"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "H’s & T’s: suspected hyperkalemia, hypocalcemia, or calcium-channel-blocker toxicity (your list: otherwise not indicated in arrest).",
     "doseMatch": "Cardiac arrest|2-4 g|20 mg\\/kg"
    },
    {
     "drug": "dextrose",
     "role": "cond",
     "why": "H’s & T’s: correct documented hypoglycemia.",
     "doseMatch": "."
    },
    {
     "drug": "naloxone",
     "role": "cond",
     "why": "Suspected opioid overdose — ventilation and CPR come first.",
     "doseMatch": "."
    },
    {
     "drug": "atropine",
     "role": "avoid",
     "why": "No longer recommended for PEA/asystole in current ACLS — your list indicates it for symptomatic bradycardia with a pulse."
    },
    {
     "drug": "amiodarone",
     "role": "avoid",
     "why": "Not indicated — non-shockable rhythm; there is no VF/VT to suppress."
    }
   ]
  },
  "asystole": {
   "note": "CARDIAC ARREST — non-shockable. Confirm in 2 leads. CPR + epinephrine + H’s & T’s.",
   "drugIndicated": true,
   "also": [
    "High-quality CPR",
    "Do NOT shock",
    "Confirm flatline in a 2nd lead / check gain",
    "After ROSC: SBP <90 / MAP <65 → 1–2 L fluid bolus, then vasopressor infusion (epi / dopamine); 12-lead, SpO₂ 92–98%, avoid hyperventilation",
    "Hypothermia: check pulse up to 30–45 s; CPR + rewarm — ‘not dead until warm and dead’ (per protocol)."
   ],
   "drugs": [
    {
     "drug": "epinephrine",
     "role": "first",
     "why": "Give as soon as possible in non-shockable arrest, then q3–5 min with high-quality CPR.",
     "doseMatch": "^Cardiac Arrest",
     "administer": {
      "label": "Epinephrine 1 mg IV/IO (1:10,000)",
      "fx": "Raises perfusion pressure during CPR. Find and fix the reversible cause (H’s & T’s)."
     }
    },
    {
     "drug": "sodiumbicarbonate",
     "role": "cond",
     "why": "H’s & T’s: hyperkalemia, TCA overdose, or prolonged arrest with acidosis — after more definitive treatments.",
     "doseMatch": "1 mEq\\/kg"
    },
    {
     "drug": "calciumchloride",
     "role": "cond",
     "why": "H’s & T’s: suspected hyperkalemia, hypocalcemia, or calcium-channel-blocker toxicity (your list: otherwise not indicated in arrest).",
     "doseMatch": "Cardiac arrest|2-4 g|20 mg\\/kg"
    },
    {
     "drug": "dextrose",
     "role": "cond",
     "why": "H’s & T’s: correct documented hypoglycemia.",
     "doseMatch": "."
    },
    {
     "drug": "naloxone",
     "role": "cond",
     "why": "Suspected opioid overdose — ventilation and CPR come first.",
     "doseMatch": "."
    },
    {
     "drug": "atropine",
     "role": "avoid",
     "why": "No longer recommended for PEA/asystole in current ACLS — your list indicates it for symptomatic bradycardia with a pulse."
    },
    {
     "drug": "amiodarone",
     "role": "avoid",
     "why": "Not indicated — non-shockable rhythm; there is no VF/VT to suppress."
    }
   ]
  }
 },
 "topics": {
  "postrosc": {
   "title": "Post-ROSC care",
   "source": "AHA ACLS/PALS (2020 guidelines + 2023 focused update) · NREMT Paramedic scope",
   "note": "Perfusing rhythm after arrest. Target SBP ≥90 / MAP ≥65, SpO₂ 92–98%, ETCO₂ 35–45, 12-lead for STEMI.",
   "also": [
    "1–2 L crystalloid bolus for hypotension",
    "Vasopressor infusion if still hypotensive",
    "Treat cause; transport to PCI-capable center if STEMI"
   ],
   "drugs": [
    {
     "drug": "epinephrine",
     "role": "next",
     "why": "Alternative vasopressor infusion (manual: ROSC 0.1–0.5 mcg/kg/min, 1 mg/250 ml NS).",
     "doseMatch": "ROSC"
    },
    {
     "drug": "dopamine",
     "role": "next",
     "why": "Alternative vasopressor (your list: cardiogenic shock).",
     "doseMatch": "-20 mcg"
    },
    {
     "drug": "lidocaine",
     "role": "cond",
     "why": "Maintenance infusion after ROSC from VF/pVT if lidocaine was used (your list).",
     "doseMatch": "post-ROSC"
    },
    {
     "drug": "amiodarone",
     "role": "cond",
     "why": "After ROSC from VF/pVT per med control / local protocol.",
     "doseMatch": "with a pulse"
    }
   ]
  },
  "cardiogenicshock": {
   "title": "Cardiogenic shock",
   "source": "AHA ACLS/PALS (2020 guidelines + 2023 focused update) · NREMT Paramedic scope",
   "note": "Pump failure (often MI). Hypotension + poor perfusion ± pulmonary edema. Treat rate problems first (brady/tachy algorithms).",
   "also": [
    "Small fluid bolus only if lungs clear",
    "12-lead — STEMI → PCI center",
    "CPAP for pulmonary edema if BP tolerates (per protocol)"
   ],
   "drugs": [
    {
     "drug": "dopamine",
     "role": "next",
     "why": "Your list: cardiogenic shock.",
     "doseMatch": "-20 mcg"
    },
    {
     "drug": "nitroglycerin",
     "role": "avoid",
     "why": "Hypotension — nitrates contraindicated with SBP <90."
    },
    {
     "drug": "morphine",
     "role": "avoid",
     "why": "Hypotension — vasodilation and respiratory depression worsen shock."
    }
   ]
  },
  "digoxintox": {
   "title": "Digoxin toxicity",
   "source": "AHA ACLS toxicology · NREMT Paramedic scope",
   "note": "Strip clues: PAT with block, accelerated junctional / junctional tach, slow regularized A-fib, bidirectional VT, frequent PVCs/bigeminy, high-grade AV block. GI upset, visual changes (yellow-green halos), confusion; hyperkalemia in acute OD.",
   "also": [
    "Paramedic: ABCs, monitor/12-lead, IV, treat symptomatic brady per brady algorithm (atropine, TCP)",
    "Early notification — antidote (Fab) is hospital/critical-care",
    "Avoid calcium; cardiovert only if unstable, lowest energy (per protocol)"
   ],
   "drugs": [
    {
     "drug": "atropine",
     "role": "first",
     "why": "Symptomatic bradycardia / AV block from digoxin (vagal effect).",
     "doseMatch": "q3-5min, max 3 mg|0\\.02 mg\\/kg"
    },
    {
     "drug": "calciumchloride",
     "role": "avoid",
     "why": "Your list contraindicates calcium in the digoxin patient."
    }
   ]
  },
  "hypothermia": {
   "title": "Hypothermia",
   "source": "AHA ACLS special circumstances (accidental hypothermia) · NREMT Paramedic scope",
   "note": "Strip clues: sinus brady → slow A-fib → VF/asystole as core temp drops; Osborn (J) waves; long PR/QRS/QT; shivering artifact. Bradycardia may be physiologic — rewarm, don’t chase the rate.",
   "also": [
    "Remove wet clothing, passive + active external rewarming; warmed IV/IO fluids (40–42 °C)",
    "Handle gently — rough movement can trigger VF",
    "Pulse check up to 30–45 s; CPR if pulseless",
    "Arrest: defibrillate VF; AHA — reasonable to give standard ACLS drugs while rewarming (many protocols withhold meds <30 °C and space them out 30–34 °C)",
    "Pacing usually not indicated for hypothermic bradycardia"
   ],
   "drugs": [
    {
     "drug": "epinephrine",
     "role": "cond",
     "why": "Hypothermic cardiac arrest only — per standard ACLS concurrent with rewarming (check local protocol for temperature limits).",
     "doseMatch": "^Cardiac Arrest"
    },
    {
     "drug": "dextrose",
     "role": "cond",
     "why": "Documented hypoglycemia (common with cold exposure, alcohol).",
     "doseMatch": "."
    },
    {
     "drug": "atropine",
     "role": "avoid",
     "why": "Hypothermic bradycardia is usually physiologic and atropine-resistant — rewarm."
    }
   ]
  },
  "bbb": {
   "title": "Bundle branch block (RBBB / LBBB)",
   "source": "AHA/ACC STEMI guideline (2013) + AHA ACLS bradycardia/tachycardia algorithms · NREMT Paramedic scope",
   "note": "NO DRUG treats a BBB itself — it is an interpretation finding (QRS ≥0.12 s; RBBB rSR′ V1, LBBB broad notched R in I/V6). Treat the patient and the underlying cause.",
   "also": [
    "New/presumed-new LBBB alone is not a STEMI equivalent — use Sgarbossa criteria / symptoms; transmit 12-lead, med control",
    "Chest pain + BBB → ACS care per protocol (aspirin, nitro if BP allows)",
    "BBB + symptomatic bradycardia / high-grade block (e.g., bifascicular + 1st degree) → bradycardia algorithm, prepare TCP",
    "Wide-complex tachycardia with known BBB: if unsure, treat as VT (unstable → synchronized cardioversion)"
   ],
   "drugs": [
    {
     "drug": "lidocaine",
     "role": "avoid",
     "why": "No antiarrhythmic is indicated for a bundle branch block — and lidocaine can suppress escape conduction."
    },
    {
     "drug": "amiodarone",
     "role": "avoid",
     "why": "No antiarrhythmic is indicated for a bundle branch block."
    }
   ]
  }
 }
};
