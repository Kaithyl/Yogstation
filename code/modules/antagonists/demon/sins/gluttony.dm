/datum/action/cooldown/spell/forcewall/gluttony
	name = "Gluttonous Wall"
	desc = "Create a magical barrier that only allows fat people to pass through."
	button_icon = 'icons/mob/actions/actions_minor_antag.dmi'
	background_icon = 'icons/mob/actions/actions_minor_antag.dmi'
	button_icon_state = "blob"
	background_icon_state = "bg_demon"

	invocation = "INDULGE"
	invocation_type = INVOCATION_SHOUT

	wall_type = /obj/effect/gluttony/timed

/datum/action/cooldown/spell/shapeshift/demon/gluttony //emergency get out of jail card, but better. It also eats everything.
	name = "Gluttony Demon Form"
	desc = "Take on your true demon form. This form is strong but very obvious. It's full demonic nature in this realm is taxing on you \
	and you will slowly lose life while in this form, while also being especially weak to holy influences. \
	Be aware low health transfers between forms. If gravely wounded, attack live mortals to siphon life energy from them! \
	Your unique form as a demon of gluttony also allows you to eat corpses to heal yourself."
	shapeshift_type = /mob/living/simple_animal/lesserdemon/gluttony

/mob/living/simple_animal/lesserdemon/gluttony //capable of devouring corpses for health
	name = "gluttonous demon"
	real_name = "gluttonous demon"
	icon_state = "lesserdaemon_gluttony"
	icon_living = "lesserdaemon_gluttony"

/mob/living/simple_animal/lesserdemon/gluttony/UnarmedAttack(mob/living/L)
	if(isliving(L)) //Eat Corpses to regen health
		if(L.stat == DEAD)
			if(do_after(src, 3 SECONDS, L))
				devour(L)
			return
	return ..()

/mob/living/simple_animal/lesserdemon/gluttony/proc/devour(mob/living/L)
	if(!L)
		return FALSE
	visible_message(
		span_danger("[src] devours [L]!"),
		span_userdanger("You feast on [L], restoring your health!"))
	adjustBruteLoss(-50)
	L.gib()
	return TRUE

/obj/effect/gluttony/timed
	///Time before it deletes itself.
	var/timeleft = 15 SECONDS

/obj/effect/gluttony/timed/Initialize()
	. = ..()
	if(timeleft)
		QDEL_IN(src, timeleft)
