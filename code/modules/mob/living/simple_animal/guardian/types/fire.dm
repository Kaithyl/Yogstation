//Fire
/mob/living/simple_animal/hostile/guardian/fire
	a_intent = INTENT_HELP
	melee_damage_lower = 7
	melee_damage_upper = 7
	attack_sound = 'sound/items/welder.ogg'
	attacktext = "ignites"
	damage_coeff = list(BRUTE = 0.7, BURN = 0.7, TOX = 0.7, CLONE = 0.7, STAMINA = 0, OXY = 0.7)
	range = 7
	playstyle_string = span_holoparasite("As a <b>chaos</b> type, you have only light damage resistance, but will ignite any enemy you bump into. In addition, your melee attacks will cause human targets to see everyone as you.")
	magic_fluff_string = span_holoparasite("..And draw the Wizard, bringer of endless chaos!")
	tech_fluff_string = span_holoparasite("Boot sequence complete. Crowd control modules activated. Holoparasite swarm online.")
	carp_fluff_string = span_holoparasite("CARP CARP CARP! You caught one! OH GOD, EVERYTHING'S ON FIRE. Except you and the fish.")

/mob/living/simple_animal/hostile/guardian/fire/Life()
	. = ..()
	if(summoner)
		summoner.extinguish_mob()
		summoner.fire_stacks = -1

/mob/living/simple_animal/hostile/guardian/fire/AttackingTarget()
	. = ..()
	if(. && ishuman(target) && target != summoner)
		new /datum/hallucination/delusion(target,TRUE,"custom",200,0, icon_state,icon)

/mob/living/simple_animal/hostile/guardian/fire/Crossed(AM as mob|obj)
	..()
	collision_ignite(AM)

/mob/living/simple_animal/hostile/guardian/fire/Bumped(atom/movable/AM)
	..()
	collision_ignite(AM)

/mob/living/simple_animal/hostile/guardian/fire/Bump(AM as mob|obj)
	..()
	collision_ignite(AM)

/mob/living/simple_animal/hostile/guardian/fire/proc/collision_ignite(AM as mob|obj)
	if(isliving(AM))
		var/mob/living/M = AM
		if(!hasmatchingsummoner(M) && M != summoner && M.fire_stacks < 7)
			M.fire_stacks = 7
			M.ignite_mob()
