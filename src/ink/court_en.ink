EXTERNAL gain(what, amount)
EXTERNAL can(what, amount)
EXTERNAL rel(who, amount)
VAR king = "Harun"
VAR rival = "Osric"
VAR day = 1
VAR m_bard = 0
VAR m_noble = 0
VAR m_prophet = 0
VAR m_smuggler = 0
VAR m_scholar = 0
VAR m_orphans = 0
VAR m_envoy = 0

=== bard ===
# speaker: Lysander the Bard
A lanky man with a lute bows so low his feathered hat sweeps the floor.
"Your Majesty! I have sung for sultans and goatherds alike. For a modest purse I will write a song of your reign that will outlive us both."
* {can("gold", 10)} [Pay him ten gold for the song]
    ~ gain("gold", -10)
    ~ gain("mood", 6)
    ~ m_bard = 1
    He strums a chord that makes the guards tap their feet. By nightfall the whole valley is humming it.
* [Ask him to sing of your hero instead]
    ~ gain("renown", 3)
    ~ m_bard = 2
    "A hero! Even better. Heroes rhyme with everything." He leaves already composing.
* [Send him away]
    ~ m_bard = 3
    He sweeps his hat back onto his head. "As you wish. Bards have long memories, Majesty."
- -> END

=== bard_return ===
# speaker: Lysander the Bard
{ m_bard == 3: Lysander is back, and he has brought a crowd. He clears his throat meaningfully.|Lysander returns, his clothes finer and his lute inlaid with silver.}
{ m_bard == 3: "I have written a new song, Majesty. It is called 'The Miser on the Throne'. Shall I perform it?"|"Your song is sung from Merrow to Qadir! Kings ask who this ruler is. I came back to thank you."}
* { m_bard == 3 and can("gold", 15)} [Pay him to sing something else]
    ~ gain("gold", -15)
    ~ gain("mood", 3)
    He bows. "A change of key, then." The new song is about the weather. Everyone is relieved.
* { m_bard == 3} [Let him sing]
    ~ gain("mood", -5)
    ~ gain("renown", -3)
    The verses are clever and cruel. The children learn them first.
* { m_bard != 3} [Welcome him as an old friend]
    ~ gain("renown", 5)
    ~ rel("all", 3)
    ~ gain("mood", 4)
    He plays late into the night. Foreign envoys write the words down.
- ~ m_bard = 9
- -> END

=== noble ===
# speaker: Lady Varenne
A noblewoman in dusty silks stands beside a farmer clutching his cap.
"This man plows land my grandfather held. I want it back, with the harvest he took from it."
The farmer says nothing. His hands are shaking.
* [Side with Lady Varenne]
    ~ gain("gold", 15)
    ~ gain("mood", -5)
    ~ m_noble = 1
    She presses a purse into your steward's hand. "A wise judgment, Majesty. I will remember it." The farmer walks out without a word.
* [Side with the farmer]
    ~ gain("mood", 6)
    ~ m_noble = 2
    The hall murmurs approval. Lady Varenne's smile does not reach her eyes. "Of course, Majesty."
* [Split the field between them]
    ~ gain("mood", 2)
    ~ gain("gold", 5)
    ~ m_noble = 3
    Neither is happy. Both bow. That is usually how you know it was fair.
- -> END

=== noble_return ===
# speaker: Lady Varenne
{ m_noble == 1: Lady Varenne returns with armed riders at her back, all wearing your colors.|Lady Varenne returns. She is not smiling at all now.}
{ m_noble == 1: "You stood by my house. My house will stand by you. Take this, for your walls."|"Word has reached me that you favor peasants over blood. Some of my cousins would pay well to see your keep burn."}
* { m_noble == 1} [Accept her gift]
    ~ gain("gold", 20)
    ~ gain("renown", 3)
    Twenty gold and a new friend at court.
* { m_noble == 2 and can("gold", 12)} [Buy her silence]
    ~ gain("gold", -12)
    She weighs the purse. "Cousins can be persuaded."
* { m_noble == 2} [Have her escorted out]
    ~ gain("renown", 4)
    ~ gain("mood", 3)
    The guards are glad to do it. Tonight the farmers drink to your name.
* { m_noble == 3} [Hear her new complaint]
    ~ gain("gold", 6)
    She has found another field to argue over. You charge a fee for the hearing.
- ~ m_noble = 9
- -> END

=== prophet ===
# speaker: The Prophet of the Dunes
An old man wrapped in sun-bleached cloth stares past you at something no one else can see.
"The sand speaks to me, crowned one. It says the moon will bleed, and the wells will taste of salt, unless the valley gives back to the desert."
* {can("food", 8)} [Leave eight food at the desert's edge]
    ~ gain("food", -8)
    ~ gain("mood", 4)
    ~ m_prophet = 1
    The villagers watch you do it. They sleep easier tonight, whatever the moon does.
* [Ask what he wants for himself]
    He laughs until he coughs. "Nothing. That is the point."
    ~ m_prophet = 2
    ~ gain("renown", 1)
* [Have him thrown out]
    ~ m_prophet = 3
    ~ gain("mood", -3)
    He goes without a struggle, muttering about salt.
- -> END

=== prophet_return ===
# speaker: The Prophet of the Dunes
{ m_prophet == 1: The old man is back. This time he carries a forked stick.|The old man returns, thinner than before.}
{ m_prophet == 1: "The desert remembers its friends. I have walked your valley. There is water under the third palm from the well."|"The wells will taste of salt. I did warn you."}
* { m_prophet == 1} [Dig where he points]
    ~ gain("food", 18)
    ~ gain("mood", 3)
    Sweet water, enough for new fields. The villagers call it the Prophet's Spring.
* { m_prophet != 1} [Ask how to undo it]
    ~ gain("food", -6)
    "Give, and keep giving." He takes a loaf on his way out.
- ~ m_prophet = 9
- -> END

=== smuggler ===
# speaker: Qadim the Salt Runner
A sunburned man with too many rings slides a sack across the floor. It is full of salt.
"No taxes, no questions, Majesty. Ten measures for fifteen gold. Half the market price, and the market never needs to know."
* {can("gold", 15)} [Buy the salt]
    ~ gain("gold", -15)
    ~ gain("salt", 10)
    ~ m_smuggler = 1
    The sack vanishes into your stores. Qadim winks. "Pleasure doing business."
* [Arrest him]
    ~ gain("renown", 3)
    ~ gain("salt", 4)
    ~ m_smuggler = 2
    The guards seize what he carried. The honest salt merchants send their thanks.
* [Tell him to try the market like everyone else]
    ~ m_smuggler = 3
    He shrugs. "Markets are for people who like paying."
- -> END

=== smuggler_return ===
# speaker: Qadim the Salt Runner
{ m_smuggler == 1: Qadim is back, all smiles, with two sacks this time.|A cart pulls up with a cracked axle and a familiar face behind it.}
{ m_smuggler == 1: "My best customer! But a little bird tells me the guild is asking where your salt came from. Another deal, and I forget your name."|"No hard feelings, Majesty. I have reformed. Mostly. Spices, honestly taxed."}
* { m_smuggler == 1 and can("gold", 10)} [Pay for his silence]
    ~ gain("gold", -10)
    ~ gain("salt", 6)
    He throws in a little extra salt. Silence, it turns out, is salty.
* { m_smuggler == 1} [Refuse and let the guild talk]
    ~ gain("renown", -4)
    ~ gain("mood", 2)
    The gossip stings, but the villagers like a ruler who won't be squeezed.
* { m_smuggler != 1} [Buy his honest spices]
    ~ gain("gold", -4)
    ~ gain("mood", 5)
    The market smells of cumin for a week.
- ~ m_smuggler = 9
- -> END

=== scholar ===
# speaker: Ibn Tariq the Astronomer
A young scholar unrolls a star chart across your table, pinning it with your own goblets.
"With a proper tower and twenty gold for lenses, I could chart the caravan stars. Your merchants would never lose their way again."
* {can("gold", 20)} [Fund the observatory]
    ~ gain("gold", -20)
    ~ m_scholar = 1
    He nearly knocks over the goblets in his excitement.
* [Ask him to teach the children instead]
    ~ gain("mood", 4)
    ~ m_scholar = 2
    He looks disappointed, then delighted. Children ask better questions than kings.
* [Not now]
    ~ m_scholar = 3
    He rolls up the chart carefully. "The stars will wait. They are good at it."
- -> END

=== scholar_return ===
# speaker: Ibn Tariq the Astronomer
{ m_scholar == 1: Ibn Tariq arrives with a bound book of charts and a merchant guildmaster in tow.|Ibn Tariq is back, ink on his fingers.}
{ m_scholar == 1: "The caravan stars, all of them. The guild wants copies. I told them to ask you."|"I found a patron in Merrow. I wanted you to hear it from me."}
* { m_scholar == 1} [Sell copies to the guild]
    ~ gain("gold", 35)
    ~ gain("renown", 4)
    The guildmaster pays without haggling, which worries everyone.
* { m_scholar == 1} [Give the charts away freely]
    ~ gain("renown", 8)
    ~ rel("all", 4)
    Every crown in Ashkara now navigates by your stars.
* { m_scholar != 1} [Wish him well]
    ~ rel("all", 1)
    He bows. "I will name a star after your keep. A small one."
- ~ m_scholar = 9
- -> END

=== orphans ===
# speaker: Sister Maren
A tired woman leads six children into the hall. Their clothes smell of smoke.
"Raiders burned our village by the salt flats. We walked three days. Please, Majesty. They can work, or they will, soon."
* {can("food", 10)} [Take them in]
    ~ gain("food", -10)
    ~ gain("mood", 6)
    ~ gain("pop", 1)
    ~ m_orphans = 1
    The cook adopts all six on the spot. Sister Maren stays to help.
* [Give them bread for the road]
    ~ gain("food", -3)
    ~ m_orphans = 2
    They thank you and walk on toward Hallowmere.
* [Turn them away]
    ~ gain("mood", -6)
    ~ m_orphans = 3
    The hall is very quiet after they leave.
- -> END

=== envoy ===
# speaker: A hooded envoy
A visitor arrives after dark and lowers a hood. Under it is the seal of {king}.
"My master does not trust {rival}, and neither should you. A quiet understanding between our crowns would profit us both. No one need know."
* [Agree to the secret pact]
    ~ rel("king", 12)
    ~ rel("rival", -6)
    ~ m_envoy = 1
    The envoy leaves before dawn. A purse of goodwill follows within the week.
    ~ gain("gold", 10)
* [Expose the envoy at court]
    ~ rel("king", -12)
    ~ rel("rival", 8)
    ~ gain("renown", 4)
    ~ m_envoy = 2
    The court gasps. {rival} will hear of your honesty. {king} will hear of it too.
* [Send him home with no answer]
    ~ m_envoy = 3
    "Silence is also an answer," he says, and goes.
- -> END
