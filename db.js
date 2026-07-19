// WordSpark Database Service using IndexedDB
// Handles offline storage for words, favorites, and history.

const DB_NAME = 'WordSparkDB';
const DB_VERSION = 1;

let dbInstance = null;

// Default Seed Words (100 premium vocabulary words)
const SEED_WORDS = [
  { word: "Abnegation", meaning: "The act of renouncing or rejecting something.", pronunciation: "/ˌabnəˈɡāSH(ə)n/", example: "Her abnegation of political power surprised the nation.", synonyms: "renunciation, rejection, surrender, refusal", antonyms: "acceptance, indulgence, claim", difficulty: "Hard" },
  { word: "Aberration", meaning: "A departure from what is normal, usual, or expected, typically one that is unwelcome.", pronunciation: "/ˌabəˈrāSH(ə)n/", example: "The sudden snowstorm in July was a weather aberration.", synonyms: "anomaly, deviation, divergence, abnormality", antonyms: "conformity, normality, regularity", difficulty: "Hard" },
  { word: "Acumen", meaning: "The ability to make good judgments and quick decisions, typically in a particular domain.", pronunciation: "/əˈkyo͞omən/", example: "Her business acumen helped the startup secure venture funding.", synonyms: "astuteness, shrewdness, sharpness, intelligence", antonyms: "ignorance, stupidity, denseness", difficulty: "Hard" },
  { word: "Anachronistic", meaning: "Belonging or appropriate to a period other than that in which it exists.", pronunciation: "/əˌnakrəˈnistik/", example: "The historical novel was filled with anachronistic details like watches in medieval times.", synonyms: "outdated, archaic, chronological error, obsolete", antonyms: "contemporary, modern, timely", difficulty: "Hard" },
  { word: "Assiduous", meaning: "Showing great care and perseverance.", pronunciation: "/əˈsijo͞oəs/", example: "The student was assiduous in her studies, earning top marks in all subjects.", synonyms: "diligent, industrious, hard-working, meticulous", antonyms: "lazy, negligent, careless", difficulty: "Medium" },
  { word: "Alacrity", meaning: "Brisk and cheerful readiness.", pronunciation: "/əˈlakrədē/", example: "He accepted the dream job offer with alacrity.", synonyms: "eagerness, enthusiasm, readiness, speed", antonyms: "apathy, reluctance, hesitation", difficulty: "Medium" },
  { word: "Belligerent", meaning: "Hostile and aggressive; inclined to fight.", pronunciation: "/bəˈlijərənt/", example: "The customer became belligerent when his request was denied.", synonyms: "combative, pugnacious, hostile, warlike", antonyms: "peaceful, friendly, amicable", difficulty: "Easy" },
  { word: "Benevolent", meaning: "Well meaning and kindly; serving a charitable rather than a profit-making purpose.", pronunciation: "/bəˈnevələnt/", example: "The benevolent donor gifted a new wing to the children's hospital.", synonyms: "kindly, charitable, altruistic, magnanimous", antonyms: "malevolent, cruel, unkind", difficulty: "Easy" },
  { word: "Cacophony", meaning: "A harsh, discordant mixture of sounds.", pronunciation: "/kəˈkäfənē/", example: "A loud cacophony of car horns echoed through the busy city center.", synonyms: "din, racket, noise, discord", antonyms: "harmony, silence, euphony", difficulty: "Medium" },
  { word: "Capricious", meaning: "Given to sudden and unaccountable changes of mood or behavior.", pronunciation: "/kəˈpriSHəs/", example: "The capricious administration kept changing the policy rules weekly.", synonyms: "unpredictable, temperamental, volatile, fickle", antonyms: "stable, consistent, constant", difficulty: "Hard" },
  { word: "Castigate", meaning: "Reprimand or criticize someone severely.", pronunciation: "/ˈkastəˌɡāt/", example: "The coach castigated the players for their poor defensive efforts.", synonyms: "reprimand, scold, chastise, rebuke", antonyms: "praise, commend, congratulate", difficulty: "Hard" },
  { word: "Chicanery", meaning: "The use of trickery to achieve a political, financial, or legal purpose.", pronunciation: "/SHəˈkān(ə)rē/", example: "The lawyer was disbarred for financial chicanery and manipulation.", synonyms: "trickery, deception, underhandedness, duplicity", antonyms: "honesty, truthfulness, integrity", difficulty: "Hard" },
  { word: "Cogent", meaning: "Clear, logical, and convincing.", pronunciation: "/ˈkōjənt/", example: "She put forward a cogent argument for reducing carbon emissions.", synonyms: "convincing, compelling, persuasive, rational", antonyms: "unconvincing, weak, illogical", difficulty: "Medium" },
  { word: "Compunction", meaning: "A feeling of guilt or moral scruple that prevents or follows the doing of something bad.", pronunciation: "/kəmˈpəNG(k)SH(ə)n/", example: "The thief showed no compunction as he walked away with the jewelry.", synonyms: "remorse, guilt, regret, qualm", antonyms: "indifference, satisfaction, pride", difficulty: "Hard" },
  { word: "Conundrum", meaning: "A confusing and difficult problem or question.", pronunciation: "/kəˈnəndrəm/", example: "How to balance the state budget without raising taxes is a political conundrum.", synonyms: "puzzle, riddle, enigma, dilemma", antonyms: "solution, answer, resolution", difficulty: "Easy" },
  { word: "Copious", meaning: "Abundant in supply or quantity.", pronunciation: "/ˈkōpēəs/", example: "He took copious notes during the biology lecture to prepare for the test.", synonyms: "abundant, plentiful, ample, profuse", antonyms: "sparse, scarce, meager", difficulty: "Easy" },
  { word: "Corroborate", meaning: "Confirm or give support to (a statement, theory, or finding).", pronunciation: "/kəˈräbəˌrāt/", example: "Independent witnesses were called to corroborate the suspect's alibi.", synonyms: "confirm, verify, support, validate", antonyms: "contradict, refute, deny", difficulty: "Medium" },
  { word: "Credulity", meaning: "A tendency to be too ready to believe that something is real or true.", pronunciation: "/krəˈd(y)o͞olədē/", example: "Advertisers prey on the public's credulity with miracle cure claims.", synonyms: "gullibility, simplicity, naivety", antonyms: "skepticism, disbelief, suspicion", difficulty: "Hard" },
  { word: "Dearth", meaning: "A scarcity or lack of something.", pronunciation: "/dərTH/", example: "There is a dearth of qualified software programmers in the local job market.", synonyms: "scarcity, shortage, lack, deficiency", antonyms: "abundance, surplus, plethora", difficulty: "Medium" },
  { word: "Decorum", meaning: "Behavior in keeping with good taste and propriety.", pronunciation: "/dəˈkôrəm/", example: "She accepted the award with grace and decorum.", synonyms: "propriety, decency, politeness, etiquette", antonyms: "impropriety, indecency, rudeness", difficulty: "Medium" },
  { word: "Deference", meaning: "Humble submission and respect.", pronunciation: "/ˈdef(ə)rəns/", example: "He bowed his head in deference to the visiting king.", synonyms: "respect, submission, reverence, courtesy", antonyms: "disrespect, defiance, impudence", difficulty: "Medium" },
  { word: "Demagogue", meaning: "A political leader who seeks support by appealing to popular desires and prejudices rather than by using rational argument.", pronunciation: "/ˈdeməˌɡäɡ/", example: "The senator was labeled a demagogue for stoking public fears.", synonyms: "rabble-rouser, agitator, firebrand", antonyms: "statesman, peacemaker", difficulty: "Hard" },
  { word: "Deprecate", meaning: "Express disapproval of; make light of.", pronunciation: "/ˈdeprəˌkāt/", example: "The teacher deprecated the use of calculators during basic arithmetic exams.", synonyms: "disapprove of, deplore, abhor, look down on", antonyms: "approve, praise, support", difficulty: "Hard" },
  { word: "Desiccated", meaning: "Lacking interest, passion, or energy; dehydrated or dried out.", pronunciation: "/ˈdesəˌkādəd/", example: "The scholar found the desiccated lecture on ancient grammar extremely boring.", synonyms: "dried, parched, dry, lifeless", antonyms: "moist, hydrated, vibrant", difficulty: "Hard" },
  { word: "Diatribe", meaning: "A forceful and bitter verbal attack against someone or something.", pronunciation: "/ˈdīəˌtrīb/", example: "The angry manager launched into a diatribe against his lazy team.", synonyms: "tirade, harangue, verbal attack, onslaught", antonyms: "eulogy, tribute, praise", difficulty: "Hard" },
  { word: "Didactic", meaning: "Intended to teach, particularly in having moral instruction as an ulterior motive.", pronunciation: "/dīˈdaktik/", example: "The children's fable was didactic, warning them against vanity.", synonyms: "instructive, educational, moralizing, pedantic", antonyms: "uninstructive, entertaining", difficulty: "Medium" },
  { word: "Diffident", meaning: "Modest or shy because of a lack of self-confidence.", pronunciation: "/ˈdifəd(ə)nt/", example: "The diffident boy stood quietly in the corner during the party.", synonyms: "shy, bashful, modest, self-effacing", antonyms: "confident, bold, outgoing", difficulty: "Medium" },
  { word: "Dilatory", meaning: "Slow to act; intended to cause delay.", pronunciation: "/ˈdiləˌtôrē/", example: "The defense lawyer used dilatory tactics to postpone the trial date.", synonyms: "slow, tardy, unhurried, stalling", antonyms: "prompt, fast, expeditious", difficulty: "Hard" },
  { word: "Disparate", meaning: "Essentially different in kind; not allowing comparison.", pronunciation: "/ˈdispərət/", example: "The team brought together experts from disparate fields of biology and physics.", synonyms: "contrasting, different, diverse, dissimilar", antonyms: "similar, identical, uniform", difficulty: "Medium" },
  { word: "Dissemble", meaning: "Conceal one's true motives, feelings, or beliefs.", pronunciation: "/dəˈsembəl/", example: "She smiled to dissemble her deep disappointment with the score.", synonyms: "disguise, conceal, mask, feign", antonyms: "reveal, expose, show", difficulty: "Hard" },
  { word: "Dissonance", meaning: "A lack of harmony or agreement between elements.", pronunciation: "/ˈdisənəns/", example: "There was a noticeable dissonance between his words and his actions.", synonyms: "discord, disagreement, conflict, incongruity", antonyms: "harmony, agreement, accord", difficulty: "Medium" },
  { word: "Ebullient", meaning: "Cheerful and full of energy.", pronunciation: "/iˈbo͞olyənt/", example: "The ebullient crowd cheered wildly as the home team won.", synonyms: "exuberant, cheerful, high-spirited, vivacious", antonyms: "depressed, gloomy, lethargic", difficulty: "Medium" },
  { word: "Eclectic", meaning: "Deriving ideas, style, or taste from a broad and diverse range of sources.", pronunciation: "/əˈklektik/", example: "The restaurant features an eclectic menu with dishes from five continents.", synonyms: "diverse, wide-ranging, broad, varied", antonyms: "narrow, specialized, uniform", difficulty: "Easy" },
  { word: "Effrontery", meaning: "Insolent or impertinent behavior.", pronunciation: "/əˈfrənterē/", example: "The guest had the effrontery to complain about the food to the host's face.", synonyms: "audacity, impudence, cheek, insolence", antonyms: "politeness, respect, modesty", difficulty: "Hard" },
  { word: "Egregious", meaning: "Outstandingly bad; shocking.", pronunciation: "/əˈɡrējəs/", example: "The referee made an egregious error that cost them the championship.", synonyms: "shocking, horrific, terrible, flagrant", antonyms: "minor, unnoticeable, admirable", difficulty: "Medium" },
  { word: "Ephemeral", meaning: "Lasting for a very short time.", pronunciation: "/əˈfemərəl/", example: "The beautiful colors of the sunset were ephemeral, disappearing in minutes.", synonyms: "fleeting, short-lived, transient, brief", antonyms: "permanent, eternal, everlasting", difficulty: "Medium" },
  { word: "Equivocate", meaning: "Use ambiguous language so as to conceal the truth or avoid committing oneself.", pronunciation: "/əˈkwivəˌkāt/", example: "The politician chose to equivocate rather than give a direct answer.", synonyms: "hedge, dodge, prevaricate, beat around the bush", antonyms: "confront, speak clearly, be frank", difficulty: "Hard" },
  { word: "Esoteric", meaning: "Intended for or likely to be understood by only a small number of people with a specialized knowledge.", pronunciation: "/ˌesəˈterik/", example: "The book contains esoteric information about medieval alchemy.", synonyms: "obscure, mysterious, arcane, recondite", antonyms: "popular, public, common", difficulty: "Medium" },
  { word: "Euphemism", meaning: "A mild or indirect word or expression substituted for one considered to be too harsh or blunt.", pronunciation: "/ˈyo͞ofəˌmizəm/", example: "'Passing away' is a common euphemism for dying.", synonyms: "polite term, underplay, substitute", antonyms: "dysphemism, blunt statement", difficulty: "Easy" },
  { word: "Exacerbate", meaning: "Make a problem, bad situation, or negative feeling worse.", pronunciation: "/iɡˈzasərˌbāt/", example: "Scratching an insect bite will only exacerbate the itching.", synonyms: "aggravate, worsen, inflame, intensify", antonyms: "alleviate, soothe, improve", difficulty: "Easy" },
  { word: "Exculpate", meaning: "Show or declare that someone is not guilty of wrongdoing.", pronunciation: "/ˈekskəlˌpāt/", example: "The DNA evidence served to exculpate the wrongfully accused man.", synonyms: "exonerate, acquit, vindicate, clear", antonyms: "convict, blame, incriminate", difficulty: "Hard" },
  { word: "Exigent", meaning: "Pressing; demanding; requiring immediate action.", pronunciation: "/ˈeksəjənt/", example: "The surgeon was called away to handle an exigent medical emergency.", synonyms: "urgent, pressing, critical, acute", antonyms: "non-urgent, trivial, relaxed", difficulty: "Hard" },
  { word: "Fastidious", meaning: "Very attentive to and concerned about accuracy and detail.", pronunciation: "/faˈstidēəs/", example: "He is fastidious about keeping his workspace clean and organized.", synonyms: "scrupulous, meticulous, detail-oriented, fussy", antonyms: "easygoing, sloppy, careless", difficulty: "Medium" },
  { word: "Fervid", meaning: "Intensely enthusiastic or passionate, especially to an excessive degree.", pronunciation: "/ˈfərvəd/", example: "The preacher delivered a fervid sermon that moved the congregation to tears.", synonyms: "passionate, intense, ardent, fanatical", antonyms: "apathetic, indifferent, cold", difficulty: "Hard" },
  { word: "Florid", meaning: "Elaborately or excessively complicated, ornate, or red-faced.", pronunciation: "/ˈflôrəd/", example: "His writing style is highly florid, filled with unnecessary adjectives.", synonyms: "ornate, fancy, elaborate, rosy", antonyms: "plain, simple, pale, bare", difficulty: "Medium" },
  { word: "Foment", meaning: "Instigate or stir up (an undesirable or violent sentiment or course of action).", pronunciation: "/fōˈment/", example: "The rebels tried to foment a revolution among the farmworkers.", synonyms: "instigate, incite, provoke, agitate", antonyms: "quell, suppress, calm", difficulty: "Hard" },
  { word: "Garrulous", meaning: "Excessively talkative, especially on trivial matters.", pronunciation: "/ˈɡerələs/", example: "The garrulous barber kept talking throughout the entire haircut.", synonyms: "talkative, loquacious, chatty, wordy", antonyms: "taciturn, silent, reticent", difficulty: "Medium" },
  { word: "Grandiloquent", meaning: "Pompous or extravagant in language, style, or manner, especially in a way that is intended to impress.", pronunciation: "/ɡranˈdiləkwənt/", example: "He made grandiloquent claims about his status that nobody believed.", synonyms: "pompous, pretentious, bombastic, high-flown", antonyms: "simple, plain, humble, understated", difficulty: "Hard" },
  { word: "Gregarious", meaning: "Fond of company; sociable.", pronunciation: "/ɡrəˈɡerēəs/", example: "Dolphins are gregarious animals, traveling in large social pods.", synonyms: "sociable, outgoing, friendly, companionable", antonyms: "unsociable, introverted, solitary", difficulty: "Easy" },
  { word: "Guile", meaning: "Sly or cunning intelligence.", pronunciation: "/ɡīl/", example: "He used his business guile to outmaneuver all his competitors.", synonyms: "cunning, craftiness, slyness, deviousness", antonyms: "honesty, sincerity, integrity", difficulty: "Medium" },
  { word: "Hackneyed", meaning: "Lacking significance through having been overused; unoriginal and trite.", pronunciation: "/ˈhaknēd/", example: "The romantic movie was ruined by hackneyed plotlines and dialogue.", synonyms: "cliché, trite, overdone, commonplace", antonyms: "fresh, original, novel", difficulty: "Medium" },
  { word: "Harangue", meaning: "A lengthy and aggressive speech.", pronunciation: "/həˈraNG/", example: "The boss gave the team a long harangue about missing their quarterly quotas.", synonyms: "tirade, lecture, rant, diatribe", antonyms: "tribute, speech of praise", difficulty: "Hard" },
  { word: "Iconoclast", meaning: "A person who attacks cherished beliefs or institutions.", pronunciation: "/īˈkänəˌklast/", example: "As an iconoclast, the artist rejected traditional academic painting styles.", synonyms: "rebel, nonconformist, individualist, dissident", antonyms: "conformist, traditionalist", difficulty: "Hard" },
  { word: "Impetuous", meaning: "Acting or done quickly and without thought or care.", pronunciation: "/imˈpeCHo͞oəs/", example: "Her impetuous decision to buy the expensive car left her broke.", synonyms: "impulsive, rash, reckless, hasty", antonyms: "cautious, careful, premeditated", difficulty: "Medium" },
  { word: "Implacable", meaning: "Unable to be placated or appeased.", pronunciation: "/imˈplakəb(ə)l/", example: "The implacable warden refused to grant the prisoner a day release.", synonyms: "unappeasable, unforgiving, relentless, ruthless", antonyms: "merciful, flexible, forgiving", difficulty: "Hard" },
  { word: "Inchoate", meaning: "Just begun and so not fully formed or developed; rudimentary.", pronunciation: "/inˈkōət/", example: "At this stage, our plans for building a new home are still inchoate.", synonyms: "rudimentary, undeveloped, unformed, beginning", antonyms: "mature, developed, complete", difficulty: "Hard" },
  { word: "Inimical", meaning: "Tending to obstruct or harm; unfriendly.", pronunciation: "/əˈnimək(ə)l/", example: "High tax rates can be inimical to economic investment and growth.", synonyms: "harmful, detrimental, hostile, unfavorable", antonyms: "beneficial, friendly, helpful", difficulty: "Hard" },
  { word: "Inscrutable", meaning: "Impossible to understand or interpret.", pronunciation: "/inˈskro͞odəb(ə)l/", example: "He wore an inscrutable expression, making it impossible to tell what he was thinking.", synonyms: "unreadable, mysterious, enigmatic, cryptic", antonyms: "expressive, clear, transparent", difficulty: "Medium" },
  { word: "Insipid", meaning: "Lacking flavor or vigor; boring.", pronunciation: "/inˈsipid/", example: "The cafeteria served insipid soup that tasted like warm water.", synonyms: "tasteless, bland, dull, boring", antonyms: "tasty, flavorful, interesting, exciting", difficulty: "Easy" },
  { word: "Intractable", meaning: "Hard to control or deal with.", pronunciation: "/inˈtraktəb(ə)l/", example: "Inflation is proving to be an intractable problem for the government.", synonyms: "stubborn, unmanageable, obstinate, difficult", antonyms: "docile, manageable, cooperative", difficulty: "Medium" },
  { word: "Intransigent", meaning: "Uncompromising; refusing to change one's views.", pronunciation: "/inˈtransəjənt/", example: "Both sides in the union strike remained intransigent, prolonging the dispute.", synonyms: "uncompromising, stubborn, inflexible, obstinate", antonyms: "flexible, compliant, cooperative", difficulty: "Hard" },
  { word: "Inundate", meaning: "Overwhelm (someone) with things or people to be dealt with.", pronunciation: "/ˈinənˌdāt/", example: "We were inundated with applications after posting the job listing.", synonyms: "overwhelm, flood, swamp, deluge", antonyms: "drain, undersupply", difficulty: "Easy" },
  { word: "Irascible", meaning: "Having or showing a tendency to be easily angered.", pronunciation: "/iˈrasəb(ə)l/", example: "The irascible old man yelled at the children to get off his lawn.", synonyms: "irritable, short-tempered, crabby, touchy", antonyms: "good-natured, patient, easygoing", difficulty: "Medium" },
  { word: "Laconic", meaning: "Using very few words.", pronunciation: "/ləˈkänik/", example: "His laconic reply of 'No' cut off any further discussion.", synonyms: "brief, concise, terse, quiet", antonyms: "verbose, wordy, loquacious", difficulty: "Medium" },
  { word: "Loquacious", meaning: "Talkative; tending to talk a great deal.", pronunciation: "/lōˈkwāSHəs/", example: "The loquacious tour guide kept us entertained during the long bus ride.", synonyms: "talkative, garrulous, chatty, verbose", antonyms: "taciturn, silent, reticent", difficulty: "Medium" },
  { word: "Lucid", meaning: "Expressed clearly; easy to understand.", pronunciation: "/ˈlo͞osəd/", example: "The textbook offers a lucid explanation of complex cell division.", synonyms: "clear, intelligible, comprehensible, coherent", antonyms: "confusing, obscure, vague", difficulty: "Easy" },
  { word: "Mellifluous", meaning: "Sweet or musical; pleasant to hear.", pronunciation: "/məˈlifləwəs/", example: "The voice actor's mellifluous tones were perfect for reading audiobooks.", synonyms: "sweet-sounding, musical, dulcet, smooth", antonyms: "grating, harsh, cacophonous", difficulty: "Medium" },
  { word: "Meticulous", meaning: "Showing great attention to detail; very careful and precise.", pronunciation: "/məˈtikyələs/", example: "She did meticulous research before writing her final thesis paper.", synonyms: "careful, precise, detailed, thorough", antonyms: "careless, sloppy, negligent", difficulty: "Easy" },
  { word: "Mitigate", meaning: "Make less severe, serious, or painful.", pronunciation: "/ˈmitəˌɡāt/", example: "Planting trees can help mitigate the effects of carbon emissions.", synonyms: "alleviate, reduce, lessen, ease", antonyms: "aggravate, worsen, intensify", difficulty: "Easy" },
  { word: "Morose", meaning: "Sullen and ill-tempered.", pronunciation: "/məˈrōs/", example: "He sat in morose silence after his team lost the soccer final.", synonyms: "gloomy, sullen, moody, sour", antonyms: "cheerful, happy, bright", difficulty: "Medium" },
  { word: "Munificent", meaning: "More generous than is usual or necessary.", pronunciation: "/myo͞oˈnifəsənt/", example: "A munificent benefactor paid off the entire mortgage of the charity school.", synonyms: "generous, bountiful, philanthropic, charitable", antonyms: "stingy, mean, parsimonious", difficulty: "Hard" },
  { word: "Nefarious", meaning: "Wicked or criminal.", pronunciation: "/nəˈferēəs/", example: "The computer hacker executed a nefarious scheme to steal bank passwords.", synonyms: "wicked, evil, villainous, criminal", antonyms: "noble, good, honest", difficulty: "Medium" },
  { word: "Obdurate", meaning: "Stubbornly refusing to change one's opinion or course of action.", pronunciation: "/ˈäbd(y)ərət/", example: "Despite hours of pleading, the landlord remained obdurate and evicted the family.", synonyms: "stubborn, obstinate, unyielding, inflexible", antonyms: "compliant, malleable, soft-hearted", difficulty: "Hard" },
  { word: "Obsequious", meaning: "Obedient or attentive to an excessive or servile degree.", pronunciation: "/əbˈsēkwēəs/", example: "The waiter bowed in an obsequious manner, hoping for a large tip.", synonyms: "servile, fawning, sycophantic, submissive", antonyms: "domineering, rebellious, independent", difficulty: "Hard" },
  { word: "Obviate", meaning: "Remove (a need or difficulty); avoid or prevent.", pronunciation: "/ˈäbvēˌāt/", example: "A smart thermostat can obviate the need for manual temperature adjustments.", synonyms: "remove, prevent, eliminate, bypass", antonyms: "create, necessitate, require", difficulty: "Hard" },
  { word: "Occlude", meaning: "Stop, close up, or obstruct (an opening, orifice, or passage).", pronunciation: "/əˈklo͞od/", example: "A blood clot can occlude a major artery, causing serious damage.", synonyms: "obstruct, block, close, plug", antonyms: "open, clear, unclog", difficulty: "Hard" },
  { word: "Onerous", meaning: "Involving an amount of effort and difficulty that is oppressively burdensome.", pronunciation: "/ˈōnərəs/", example: "Filing taxes for a business is an onerous task that takes weeks.", synonyms: "burdensome, heavy, difficult, taxing", antonyms: "easy, light, effortless", difficulty: "Medium" },
  { word: "Opaque", meaning: "Not able to be seen through; not transparent.", pronunciation: "/ōˈpāk/", example: "The shower screen was made of opaque glass for complete privacy.", synonyms: "cloudy, blurred, non-transparent, obscure", antonyms: "transparent, clear, simple", difficulty: "Easy" },
  { word: "Opprobrium", meaning: "Harsh criticism or public disgrace.", pronunciation: "/əˈprōbrēəm/", example: "The corporate executive faced public opprobrium after the fraud scandal broke.", synonyms: "disgrace, shame, dishonor, condemnation", antonyms: "honor, praise, respect", difficulty: "Hard" },
  { word: "Ostentatious", meaning: "Designed to impress or attract notice; showy.", pronunciation: "/ˌästənˈtāSHəs/", example: "She wore an ostentatious diamond necklace that sparkled in the sunlight.", synonyms: "showy, pretentious, flashy, flamboyant", antonyms: "modest, simple, understated", difficulty: "Medium" },
  { word: "Paragon", meaning: "A person or thing viewed as a model of excellence.", pronunciation: "/ˈperəˌɡän/", example: "She is a paragon of virtue, always helping those in need.", synonyms: "model, pattern, exemplar, standard", antonyms: "flaw, imperfection, non-example", difficulty: "Medium" },
  { word: "Pedantic", meaning: "Excessively concerned with minor details and rules, especially in academic learning.", pronunciation: "/pəˈdantik/", example: "The editor made pedantic corrections to the paper that didn't improve readability.", synonyms: "precise, fussy, hair-splitting, nitpicking", antonyms: "imprecise, broad, informal", difficulty: "Medium" },
  { word: "Penurious", meaning: "Extremely poor; poverty-stricken; stingy.", pronunciation: "/pəˈn(y)o͞orēəs/", example: "The penurious old miser refused to heat his house even in winter.", synonyms: "poor, destitute, stingy, miserly", antonyms: "wealthy, rich, generous", difficulty: "Hard" },
  { word: "Perfidious", meaning: "Deceitful and untrustworthy.", pronunciation: "/pərˈfidēəs/", example: "The king was betrayed by a perfidious advisor who fed secrets to the enemy.", synonyms: "treacherous, disloyal, faithless, deceitful", antonyms: "loyal, faithful, trustworthy", difficulty: "Hard" },
  { word: "Perfunctory", meaning: "Done without real interest or effort.", pronunciation: "/pərˈfəNGkt(ə)rē/", example: "He gave a perfunctory nod as he walked past my desk without stopping.", synonyms: "cursory, casual, rapid, half-hearted", antonyms: "thorough, careful, detailed", difficulty: "Medium" },
  { word: "Pernicious", meaning: "Having a harmful effect, especially in a gradual or subtle way.", pronunciation: "/pərˈniSHəs/", example: "Social media rumors can have a pernicious influence on public opinions.", synonyms: "harmful, damaging, toxic, insiduous", antonyms: "beneficial, harmless, healthy", difficulty: "Medium" },
  { word: "Perspicacious", meaning: "Having a ready insight into and understanding of things.", pronunciation: "/ˌpərspəˈkāSHəs/", example: "The perspicacious detective solved the mystery in less than an hour.", synonyms: "discerning, shrewd, perceptive, sharp", antonyms: "obtuse, dull-witted, ignorant", difficulty: "Hard" },
  { word: "Philanthropic", meaning: "Seeking to promote the welfare of others, especially by donating money.", pronunciation: "/ˌfilənˈTHräpik/", example: "The billionaire's philanthropic foundation funds schools in developing countries.", synonyms: "charitable, benevolent, altruistic, humanitarian", antonyms: "miserly, selfish, greedy", difficulty: "Easy" },
  { word: "Placate", meaning: "Make (someone) less angry or hostile.", pronunciation: "/ˈplākāt/", example: "They sent a gift basket to placate the upset client.", synonyms: "pacify, appease, calm, soothe", antonyms: "provoke, anger, irritate", difficulty: "Medium" },
  { word: "Pragmatic", meaning: "Dealing with things sensibly and realistically in a way that is based on practical considerations.", pronunciation: "/praɡˈmatik/", example: "We need to take a pragmatic approach to solve this budget shortfall.", synonyms: "practical, realistic, sensible, down-to-earth", antonyms: "idealistic, impractical, romantic", difficulty: "Easy" },
  { word: "Precipitate", meaning: "Cause (an event or situation, typically one that is bad) to happen suddenly, unexpectedly, or prematurely.", pronunciation: "/prəˈsipəˌtāt/", example: "The stock market crash precipitated an economic depression.", synonyms: "cause, trigger, spark, hasten", antonyms: "hinder, slow, delay", difficulty: "Medium" },
  { word: "Prevaricate", meaning: "Speak or act in an evasive way.", pronunciation: "/prəˈverəˌkāt/", example: "The witness began to prevaricate when questioned about his location.", synonyms: "hedge, equivocate, dodge, lie", antonyms: "speak truth, be direct, confess", difficulty: "Hard" },
  { word: "Prodigal", meaning: "Spending money or resources freely and recklessly; wastefully extravagant.", pronunciation: "/ˈprädəɡəl/", example: "The prodigal son blew his entire inheritance on luxury travel in a year.", synonyms: "wasteful, extravagant, spendthrift, lavish", antonyms: "thrifty, frugal, economical", difficulty: "Hard" },
  { word: "Propriety", meaning: "The state or quality of conforming to conventionally accepted standards of behavior or morals.", pronunciation: "/prəˈprīədē/", example: "He always behaved with absolute propriety in front of his parents.", synonyms: "decorum, decency, respectability, politeness", antonyms: "impropriety, indecency, misconduct", difficulty: "Medium" },
  { word: "Quiescent", meaning: "In a state or period of temporary inactivity or dormancy.", pronunciation: "/kwēˈesnt/", example: "The volcano has been quiescent for over a hundred years.", synonyms: "dormant, inactive, quiet, resting", antonyms: "active, volatile, erupting", difficulty: "Hard" },
  { word: "Rarefy", meaning: "Make or become less dense or solid.", pronunciation: "/ˈrerəˌfī/", example: "As we climbed higher, the mountain air began to rarefy, making it hard to breathe.", synonyms: "thin, dilute, attenuate", antonyms: "condense, solidify, thicken", difficulty: "Hard" },
  { word: "Recalcitrant", meaning: "Having an obstinately uncooperative attitude toward authority.", pronunciation: "/rəˈkalsətrənt/", example: "The recalcitrant horse refused to step inside the trailer.", synonyms: "uncooperative, stubborn, rebellious, defiant", antonyms: "cooperative, compliant, obedient", difficulty: "Hard" },
  { word: "Recondite", meaning: "Little known; abstruse; obscure.", pronunciation: "/ˈrekənˌdīt/", example: "The professor's book is filled with recondite footnotes that require deep research.", synonyms: "obscure, academic, deep, complex", antonyms: "simple, basic, popular", difficulty: "Hard" },
  { word: "Refractory", meaning: "Stubborn or unmanageable; resistant to a process or stimulus.", pronunciation: "/rəˈfrakt(ə)rē/", example: "The refractory disease did not respond to standard antibiotic therapy.", synonyms: "stubborn, resistant, headstrong, obstinate", antonyms: "docile, manageable, responsive", difficulty: "Hard" },
  { word: "Repudiate", meaning: "Refuse to accept or be associated with.", pronunciation: "/rəˈpyo͞odēˌāt/", example: "The candidate was quick to repudiate the statements made by his advisor.", synonyms: "reject, disown, deny, renounce", antonyms: "accept, embrace, support", difficulty: "Medium" },
  { word: "Reticent", meaning: "Not revealing one's thoughts or feelings readily.", pronunciation: "/ˈredəsənt/", example: "She was reticent about her personal life, preferring to talk about her work.", synonyms: "reserved, quiet, tight-lipped, silent", antonyms: "outgoing, talkative, open", difficulty: "Medium" }
];

// Open IndexedDB database
function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store 1: Words
      if (!db.objectStoreNames.contains('words')) {
        const wordStore = db.createObjectStore('words', { keyPath: 'id', autoIncrement: true });
        wordStore.createIndex('word', 'word', { unique: true });
        wordStore.createIndex('difficulty', 'difficulty', { unique: false });
        wordStore.createIndex('created_at', 'created_at', { unique: false });
      }
      
      // Store 2: History
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('viewed_at', 'viewed_at', { unique: false });
      }
      
      // Store 3: Bookmarked favorites
      if (!db.objectStoreNames.contains('favorites')) {
        const favoriteStore = db.createObjectStore('favorites', { keyPath: 'word' });
        favoriteStore.createIndex('added_at', 'added_at', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export const dbService = {
  // Initialize Database: Check if seeded, if not seed it.
  async init() {
    const db = await openDB();
    const count = await this.getWordCount();
    if (count === 0) {
      console.log('Database empty. Seeding 100 default vocabulary words...');
      await this.importWords(SEED_WORDS);
      console.log('Database successfully seeded!');
    }
  },

  // Get total count of words in database
  getWordCount() {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('words', 'readonly');
        const store = tx.objectStore('words');
        const countRequest = store.count();
        
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => reject(countRequest.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Get a random word avoiding immediate repeats
  getRandomWord(customSeed = null, lastWordId = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('words', 'readonly');
        const store = tx.objectStore('words');
        
        // Fetch all word references (IDs and words) to select randomly
        const request = store.getAll();
        
        request.onsuccess = () => {
          const list = request.result;
          if (list.length === 0) {
            resolve(null);
            return;
          }
          
          let index;
          if (customSeed !== null) {
            // Seeded pseudo-randomizer to allow setting a reproducible seed
            const x = Math.sin(customSeed++) * 10000;
            const rand = x - Math.floor(x);
            index = Math.floor(rand * list.length);
          } else {
            // General randomized index
            index = Math.floor(Math.random() * list.length);
          }
          
          let selected = list[index];
          
          // Avoid repeating the last word immediately if we have multiple words
          if (list.length > 1 && selected.id === lastWordId) {
            index = (index + 1) % list.length;
            selected = list[index];
          }
          
          resolve(selected);
        };
        
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Search words by word, meaning, or synonym
  searchWords(query) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('words', 'readonly');
        const store = tx.objectStore('words');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const list = request.result;
          if (!query || query.trim() === '') {
            resolve(list.slice(0, 100)); // limit preview
            return;
          }
          
          const cleanQuery = query.toLowerCase().trim();
          const filtered = list.filter(w => {
            const wordMatch = w.word.toLowerCase().includes(cleanQuery);
            const meaningMatch = w.meaning.toLowerCase().includes(cleanQuery);
            const synMatch = w.synonyms && w.synonyms.toLowerCase().includes(cleanQuery);
            return wordMatch || meaningMatch || synMatch;
          });
          
          resolve(filtered);
        };
        
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Add a single word (returns true if added, false if duplicate)
  addWord(wordObj) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('words', 'readwrite');
        const store = tx.objectStore('words');
        
        // Format object properties
        const formatted = {
          word: wordObj.word.trim(),
          meaning: wordObj.meaning ? wordObj.meaning.trim() : '',
          pronunciation: wordObj.pronunciation ? wordObj.pronunciation.trim() : '',
          example: wordObj.example ? wordObj.example.trim() : '',
          synonyms: wordObj.synonyms ? wordObj.synonyms.toString().trim() : '',
          antonyms: wordObj.antonyms ? wordObj.antonyms.toString().trim() : '',
          difficulty: wordObj.difficulty || 'Medium',
          created_at: Date.now()
        };
        
        // Check uniqueness index
        const index = store.index('word');
        const checkRequest = index.get(formatted.word);
        
        checkRequest.onsuccess = () => {
          if (checkRequest.result) {
            resolve(false); // Duplicate found
            return;
          }
          
          const addRequest = store.add(formatted);
          addRequest.onsuccess = () => resolve(true);
          addRequest.onerror = () => reject(addRequest.error);
        };
        
        checkRequest.onerror = () => reject(checkRequest.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Bulk import words, validating duplicates, returning count metrics
  importWords(wordsList) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('words', 'readwrite');
        const store = tx.objectStore('words');
        
        let imported = 0;
        let skipped = 0;
        
        // We will process asynchronously in this transaction
        for (const item of wordsList) {
          if (!item.word || item.word.trim() === '') {
            skipped++;
            continue;
          }
          
          const formatted = {
            word: item.word.trim(),
            meaning: item.meaning ? item.meaning.trim() : '',
            pronunciation: item.pronunciation ? item.pronunciation.trim() : '',
            example: item.example ? item.example.trim() : '',
            synonyms: item.synonyms ? item.synonyms.toString().trim() : '',
            antonyms: item.antonyms ? item.antonyms.toString().trim() : '',
            difficulty: item.difficulty || 'Medium',
            created_at: Date.now()
          };
          
          try {
            // In transaction, we can add with a unique constraint. If it fails, catch and increment skipped.
            // But IndexedDB add throws constraint error on transactions. Let's do it safely.
            store.add(formatted);
            imported++;
          } catch (e) {
            skipped++;
          }
        }
        
        tx.oncomplete = () => {
          resolve({ imported, skipped });
        };
        
        tx.onerror = (e) => {
          // If transaction aborted due to unique constraints, it's fine, we catch it
          e.preventDefault();
          resolve({ imported, skipped: wordsList.length - imported });
        };
      } catch (err) {
        reject(err);
      }
    });
  },

  // Delete all words in database
  clearAllWords() {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('words', 'readwrite');
        const store = tx.objectStore('words');
        const request = store.clear();
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Add view details to History
  addToHistory(wordObj) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('history', 'readwrite');
        const store = tx.objectStore('history');
        
        const historyEntry = {
          word_id: wordObj.id || null,
          word: wordObj.word,
          viewed_at: Date.now()
        };
        
        const request = store.add(historyEntry);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Get complete history list sorted by viewed date desc
  getHistory() {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('history', 'readonly');
        const store = tx.objectStore('history');
        const index = store.index('viewed_at');
        const request = index.openCursor(null, 'prev'); // descending
        
        const list = [];
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            list.push(cursor.value);
            cursor.continue();
          } else {
            resolve(list);
          }
        };
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Clear history
  clearHistory() {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('history', 'readwrite');
        const store = tx.objectStore('history');
        const request = store.clear();
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Toggle favorite status
  toggleFavorite(wordObj) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const isFav = await this.isFavorite(wordObj.word);
        const tx = db.transaction('favorites', 'readwrite');
        const store = tx.objectStore('favorites');
        
        if (isFav) {
          const request = store.delete(wordObj.word);
          request.onsuccess = () => resolve(false); // No longer favorite
          request.onerror = () => reject(request.error);
        } else {
          const entry = {
            word: wordObj.word,
            meaning: wordObj.meaning,
            pronunciation: wordObj.pronunciation || '',
            example: wordObj.example || '',
            synonyms: wordObj.synonyms || '',
            antonyms: wordObj.antonyms || '',
            difficulty: wordObj.difficulty || 'Medium',
            added_at: Date.now()
          };
          const request = store.add(entry);
          request.onsuccess = () => resolve(true); // Now favorite
          request.onerror = () => reject(request.error);
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  // Check if word is bookmarked
  isFavorite(word) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('favorites', 'readonly');
        const store = tx.objectStore('favorites');
        const request = store.get(word);
        
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Fetch bookmarked favorites with search & sorting
  getFavorites(searchQuery = '', sortBy = 'newest') {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('favorites', 'readonly');
        const store = tx.objectStore('favorites');
        const request = store.getAll();
        
        request.onsuccess = () => {
          let list = request.result;
          
          // Search filter
          if (searchQuery && searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(w => 
              w.word.toLowerCase().includes(q) || 
              w.meaning.toLowerCase().includes(q)
            );
          }
          
          // Sorting
          if (sortBy === 'alphabetical') {
            list.sort((a, b) => a.word.localeCompare(b.word));
          } else {
            // Newest added first
            list.sort((a, b) => b.added_at - a.added_at);
          }
          
          resolve(list);
        };
        
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Get total favorites count
  getFavoritesCount() {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await openDB();
        const tx = db.transaction('favorites', 'readonly');
        const store = tx.objectStore('favorites');
        const request = store.count();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Export favorites as JSON string
  exportFavorites() {
    return new Promise(async (resolve, reject) => {
      try {
        const list = await this.getFavorites();
        resolve(JSON.stringify(list, null, 2));
      } catch (err) {
        reject(err);
      }
    });
  },

  // Full database backup structure
  backupDatabase() {
    return new Promise(async (resolve, reject) => {
      try {
        const words = await new Promise(async (res, rej) => {
          const db = await openDB();
          const tx = db.transaction('words', 'readonly');
          const store = tx.objectStore('words');
          const req = store.getAll();
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });
        
        const history = await this.getHistory();
        const favorites = await this.getFavorites();
        
        const backup = {
          app: "WordSpark",
          timestamp: Date.now(),
          words,
          history,
          favorites
        };
        
        resolve(JSON.stringify(backup, null, 2));
      } catch (err) {
        reject(err);
      }
    });
  },

  // Restore database from backup structure
  restoreDatabase(backupJSON) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = JSON.parse(backupJSON);
        if (data.app !== "WordSpark") {
          reject(new Error("Invalid backup file: App identity mismatch."));
          return;
        }
        
        const db = await openDB();
        
        // Clean database stores first
        const txClear = db.transaction(['words', 'history', 'favorites'], 'readwrite');
        txClear.objectStore('words').clear();
        txClear.objectStore('history').clear();
        txClear.objectStore('favorites').clear();
        
        txClear.oncomplete = async () => {
          // Re-insert imported records
          const txAdd = db.transaction(['words', 'history', 'favorites'], 'readwrite');
          
          if (data.words && Array.isArray(data.words)) {
            const wStore = txAdd.objectStore('words');
            data.words.forEach(w => {
              delete w.id; // clear previous IDs to autoIncrement
              wStore.add(w);
            });
          }
          
          if (data.history && Array.isArray(data.history)) {
            const hStore = txAdd.objectStore('history');
            data.history.forEach(h => {
              delete h.id;
              hStore.add(h);
            });
          }
          
          if (data.favorites && Array.isArray(data.favorites)) {
            const fStore = txAdd.objectStore('favorites');
            data.favorites.forEach(f => {
              fStore.add(f);
            });
          }
          
          txAdd.oncomplete = () => resolve(true);
          txAdd.onerror = (e) => reject(e.target.error);
        };
        
        txClear.onerror = (e) => reject(e.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }
};
