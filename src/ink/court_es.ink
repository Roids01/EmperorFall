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
# speaker: Lisandro el Bardo
Un hombre larguirucho con un laúd se inclina tanto que su sombrero de plumas barre el suelo.
"¡Majestad! He cantado para sultanes y para cabreros. Por una bolsa modesta compondré una canción de vuestro reinado que nos sobrevivirá a ambos."
* {can("gold", 10)} [Pagarle diez de oro por la canción]
    ~ gain("gold", -10)
    ~ gain("mood", 6)
    ~ m_bard = 1
    Rasga un acorde que hace que los guardias marquen el ritmo. Al caer la noche, todo el valle la tararea.
* [Pedirle que cante a tu héroe]
    ~ gain("renown", 3)
    ~ m_bard = 2
    "¡Un héroe! Aún mejor. Los héroes riman con todo." Se marcha componiendo.
* [Despedirlo]
    ~ m_bard = 3
    Vuelve a ponerse el sombrero. "Como deseéis. Los bardos tenemos buena memoria, Majestad."
- -> END

=== bard_return ===
# speaker: Lisandro el Bardo
{ m_bard == 3: Lisandro ha vuelto, y trae público. Carraspea con intención.|Lisandro regresa con ropas más finas y un laúd con incrustaciones de plata.}
{ m_bard == 3: "He compuesto una canción nueva, Majestad. Se llama 'El avaro del trono'. ¿La interpreto?"|"¡Vuestra canción se canta de Merrow a Qadir! Los reyes preguntan quién es este monarca. He vuelto a daros las gracias."}
* { m_bard == 3 and can("gold", 15)} [Pagarle para que cante otra cosa]
    ~ gain("gold", -15)
    ~ gain("mood", 3)
    Hace una reverencia. "Cambiemos de tono, entonces." La nueva canción trata del tiempo. Todos respiran aliviados.
* { m_bard == 3} [Dejarle cantar]
    ~ gain("mood", -5)
    ~ gain("renown", -3)
    Los versos son ingeniosos y crueles. Los niños los aprenden primero.
* { m_bard != 3} [Recibirlo como a un viejo amigo]
    ~ gain("renown", 5)
    ~ rel("all", 3)
    ~ gain("mood", 4)
    Toca hasta bien entrada la noche. Los enviados extranjeros apuntan la letra.
- ~ m_bard = 9
- -> END

=== noble ===
# speaker: Dama Varenne
Una noble con sedas polvorientas está junto a un campesino que estruja su gorra.
"Este hombre ara tierras que fueron de mi abuelo. Las quiero de vuelta, con la cosecha que sacó de ellas."
El campesino no dice nada. Le tiemblan las manos.
* [Dar la razón a Dama Varenne]
    ~ gain("gold", 15)
    ~ gain("mood", -5)
    ~ m_noble = 1
    Deja una bolsa en manos de tu mayordomo. "Un juicio sabio, Majestad. Lo recordaré." El campesino se va sin decir palabra.
* [Dar la razón al campesino]
    ~ gain("mood", 6)
    ~ m_noble = 2
    La sala murmura con aprobación. La sonrisa de Dama Varenne no llega a sus ojos. "Por supuesto, Majestad."
* [Repartir el campo entre los dos]
    ~ gain("mood", 2)
    ~ gain("gold", 5)
    ~ m_noble = 3
    Ninguno queda contento. Ambos se inclinan. Así suele saberse que fue justo.
- -> END

=== noble_return ===
# speaker: Dama Varenne
{ m_noble == 1: Dama Varenne vuelve con jinetes armados a su espalda, todos con tus colores.|Dama Varenne vuelve. Ahora no sonríe en absoluto.}
{ m_noble == 1: "Defendisteis a mi casa. Mi casa os defenderá. Tomad esto, para vuestras murallas."|"Me han dicho que preferís a los campesinos antes que a la sangre noble. Algunos de mis primos pagarían bien por ver arder vuestro castillo."}
* { m_noble == 1} [Aceptar su regalo]
    ~ gain("gold", 20)
    ~ gain("renown", 3)
    Veinte de oro y una nueva amiga en la corte.
* { m_noble == 2 and can("gold", 12)} [Comprar su silencio]
    ~ gain("gold", -12)
    Sopesa la bolsa. "A los primos se les puede persuadir."
* { m_noble == 2} [Hacer que la escolten fuera]
    ~ gain("renown", 4)
    ~ gain("mood", 3)
    Los guardias lo hacen con gusto. Esta noche los campesinos brindan por tu nombre.
* { m_noble == 3} [Escuchar su nueva queja]
    ~ gain("gold", 6)
    Ha encontrado otro campo por el que pleitear. Cobras una tasa por la audiencia.
- ~ m_noble = 9
- -> END

=== prophet ===
# speaker: El Profeta de las Dunas
Un anciano envuelto en tela blanqueada por el sol mira más allá de ti, a algo que nadie más ve.
"La arena me habla, coronado. Dice que la luna sangrará y que los pozos sabrán a sal, a menos que el valle devuelva algo al desierto."
* {can("food", 8)} [Dejar ocho de comida en el borde del desierto]
    ~ gain("food", -8)
    ~ gain("mood", 4)
    ~ m_prophet = 1
    Los aldeanos te ven hacerlo. Esta noche duermen más tranquilos, haga lo que haga la luna.
* [Preguntarle qué quiere para sí]
    Se ríe hasta toser. "Nada. De eso se trata."
    ~ m_prophet = 2
    ~ gain("renown", 1)
* [Hacer que lo echen]
    ~ m_prophet = 3
    ~ gain("mood", -3)
    Se marcha sin resistirse, murmurando sobre la sal.
- -> END

=== prophet_return ===
# speaker: El Profeta de las Dunas
{ m_prophet == 1: El anciano ha vuelto. Esta vez trae una vara ahorquillada.|El anciano regresa, más delgado que antes.}
{ m_prophet == 1: "El desierto recuerda a sus amigos. He recorrido vuestro valle. Hay agua bajo la tercera palmera desde el pozo."|"Los pozos sabrán a sal. Ya os lo advertí."}
* { m_prophet == 1} [Cavar donde señala]
    ~ gain("food", 18)
    ~ gain("mood", 3)
    Agua dulce, suficiente para nuevos campos. Los aldeanos la llaman la Fuente del Profeta.
* { m_prophet != 1} [Preguntar cómo deshacerlo]
    ~ gain("food", -6)
    "Dad, y seguid dando." Se lleva una hogaza al salir.
- ~ m_prophet = 9
- -> END

=== smuggler ===
# speaker: Qadim el Contrabandista
Un hombre quemado por el sol y con demasiados anillos desliza un saco por el suelo. Está lleno de sal.
"Sin impuestos ni preguntas, Majestad. Diez medidas por quince de oro. La mitad del precio del mercado, y el mercado no tiene por qué enterarse."
* {can("gold", 15)} [Comprar la sal]
    ~ gain("gold", -15)
    ~ gain("salt", 10)
    ~ m_smuggler = 1
    El saco desaparece en tus almacenes. Qadim guiña un ojo. "Un placer hacer negocios."
* [Arrestarlo]
    ~ gain("renown", 3)
    ~ gain("salt", 4)
    ~ m_smuggler = 2
    Los guardias requisan lo que llevaba. Los salineros honrados te dan las gracias.
* [Decirle que pruebe en el mercado como todos]
    ~ m_smuggler = 3
    Se encoge de hombros. "Los mercados son para quien disfruta pagando."
- -> END

=== smuggler_return ===
# speaker: Qadim el Contrabandista
{ m_smuggler == 1: Qadim ha vuelto, todo sonrisas, esta vez con dos sacos.|Llega un carro con el eje roto y una cara conocida detrás.}
{ m_smuggler == 1: "¡Mi mejor cliente! Pero un pajarito me dice que el gremio pregunta de dónde salió vuestra sal. Otro trato y olvido vuestro nombre."|"Sin rencores, Majestad. Me he reformado. Casi del todo. Especias, con sus impuestos pagados."}
* { m_smuggler == 1 and can("gold", 10)} [Pagar su silencio]
    ~ gain("gold", -10)
    ~ gain("salt", 6)
    Añade un poco más de sal. El silencio, resulta, es salado.
* { m_smuggler == 1} [Negarse y dejar que el gremio hable]
    ~ gain("renown", -4)
    ~ gain("mood", 2)
    Los chismes escuecen, pero a los aldeanos les gusta un monarca que no se deja exprimir.
* { m_smuggler != 1} [Comprar sus especias honradas]
    ~ gain("gold", -4)
    ~ gain("mood", 5)
    El mercado huele a comino durante una semana.
- ~ m_smuggler = 9
- -> END

=== scholar ===
# speaker: Ibn Tariq el Astrónomo
Un joven erudito despliega una carta estelar sobre tu mesa y la sujeta con tus propias copas.
"Con una torre adecuada y veinte de oro para lentes, podría cartografiar las estrellas de las caravanas. Vuestros mercaderes nunca volverían a perderse."
* {can("gold", 20)} [Financiar el observatorio]
    ~ gain("gold", -20)
    ~ m_scholar = 1
    Casi tira las copas de la emoción.
* [Pedirle que enseñe a los niños]
    ~ gain("mood", 4)
    ~ m_scholar = 2
    Parece decepcionado, luego encantado. Los niños hacen mejores preguntas que los reyes.
* [Ahora no]
    ~ m_scholar = 3
    Enrolla la carta con cuidado. "Las estrellas esperarán. Se les da bien."
- -> END

=== scholar_return ===
# speaker: Ibn Tariq el Astrónomo
{ m_scholar == 1: Ibn Tariq llega con un libro de cartas encuadernado y un maestre del gremio detrás.|Ibn Tariq ha vuelto, con tinta en los dedos.}
{ m_scholar == 1: "Las estrellas de las caravanas, todas. El gremio quiere copias. Les dije que os preguntaran a vos."|"Encontré un mecenas en Merrow. Quería que lo supierais por mí."}
* { m_scholar == 1} [Vender copias al gremio]
    ~ gain("gold", 35)
    ~ gain("renown", 4)
    El maestre paga sin regatear, lo que preocupa a todos.
* { m_scholar == 1} [Regalar las cartas a todos]
    ~ gain("renown", 8)
    ~ rel("all", 4)
    Todas las coronas de Ashkara navegan ahora por tus estrellas.
* { m_scholar != 1} [Desearle suerte]
    ~ rel("all", 1)
    Hace una reverencia. "Pondré a una estrella el nombre de vuestro castillo. Una pequeña."
- ~ m_scholar = 9
- -> END

=== orphans ===
# speaker: Hermana Maren
Una mujer cansada entra en la sala con seis niños. Su ropa huele a humo.
"Unos asaltantes quemaron nuestra aldea junto a las salinas. Caminamos tres días. Por favor, Majestad. Pueden trabajar, o podrán pronto."
* {can("food", 10)} [Acogerlos]
    ~ gain("food", -10)
    ~ gain("mood", 6)
    ~ gain("pop", 1)
    ~ m_orphans = 1
    La cocinera adopta a los seis en el acto. La hermana Maren se queda a ayudar.
* [Darles pan para el camino]
    ~ gain("food", -3)
    ~ m_orphans = 2
    Te dan las gracias y siguen hacia Hallowmere.
* [Rechazarlos]
    ~ gain("mood", -6)
    ~ m_orphans = 3
    La sala queda muy callada cuando se van.
- -> END

=== envoy ===
# speaker: Un enviado encapuchado
Un visitante llega de noche y se baja la capucha. Debajo lleva el sello de {king}.
"Mi señor no se fía de {rival}, y vos tampoco deberíais. Un acuerdo discreto entre nuestras coronas nos beneficiaría a ambos. Nadie tiene por qué saberlo."
* [Aceptar el pacto secreto]
    ~ rel("king", 12)
    ~ rel("rival", -6)
    ~ m_envoy = 1
    El enviado se va antes del alba. En una semana llega una bolsa de buena voluntad.
    ~ gain("gold", 10)
* [Desenmascarar al enviado ante la corte]
    ~ rel("king", -12)
    ~ rel("rival", 8)
    ~ gain("renown", 4)
    ~ m_envoy = 2
    La corte ahoga un grito. {rival} sabrá de tu honradez. {king} también.
* [Despedirlo sin respuesta]
    ~ m_envoy = 3
    "El silencio también es una respuesta", dice, y se marcha.
- -> END
