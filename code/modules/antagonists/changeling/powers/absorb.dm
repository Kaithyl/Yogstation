/datum/action/changeling/absorbDNA
	name = "Absorb DNA"
	desc = "Absorb the DNA of our victim. Requires us to strangle them."
	button_icon_state = "absorb_dna"
	chemical_cost = 0
	dna_cost = 0
	req_human = 1
	var/absorbtimer


/datum/action/changeling/absorbDNA/can_sting(mob/living/carbon/user)
	if(!..())
		return

	var/datum/antagonist/changeling/changeling = user.mind.has_antag_datum(/datum/antagonist/changeling)
	if(changeling.isabsorbing)
		to_chat(user, span_warning("We are already absorbing!"))
		return

	if(!user.pulling || !iscarbon(user.pulling))
		to_chat(user, span_warning("We must be grabbing a creature to absorb them!"))
		return
	if(user.grab_state <= GRAB_NECK)
		to_chat(user, span_warning("We must have a tighter grip to absorb this creature!"))
		return

	var/mob/living/carbon/target = user.pulling
	return changeling.can_absorb_dna(target)

/datum/action/changeling/absorbDNA/sting_action(mob/user)
	var/datum/antagonist/changeling/changeling = user.mind.has_antag_datum(/datum/antagonist/changeling)
	absorbtimer = clamp((16 - changeling.trueabsorbs) * 10, 0, 5 SECONDS) //the more people you eat, the faster you can absorb
	var/mob/living/carbon/human/target = user.pulling
	changeling.isabsorbing = 1
	for(var/i in 1 to 3)
		switch(i)
			if(1)
				to_chat(user, span_notice("This creature is compatible. We must hold still..."))
			if(2)
				user.visible_message(span_warning("[user] extends a proboscis!"), span_notice("We extend a proboscis."))
			if(3)
				user.visible_message(span_danger("[user] stabs [target] with the proboscis!"), span_notice("We stab [target] with the proboscis."))
				to_chat(target, span_userdanger("You feel a sharp stabbing pain!"))
				target.take_overall_damage(40)

		SSblackbox.record_feedback("nested tally", "changeling_powers", 1, list("Absorb DNA", "[i]"))
		if(!do_mob(user, target, absorbtimer))
			to_chat(user, span_warning("Our absorption of [target] has been interrupted!"))
			changeling.isabsorbing = 0
			return

	SSblackbox.record_feedback("nested tally", "changeling_powers", 1, list("Absorb DNA", "4"))
	user.visible_message(span_danger("[user] sucks the fluids from [target]!"), span_notice("We have absorbed [target]."))
	to_chat(target, span_userdanger("You are absorbed by the changeling!"))

	if(!changeling.has_dna(target.dna))
		changeling.add_new_profile(target)
		changeling.trueabsorbs++

	if(user.nutrition < NUTRITION_LEVEL_WELL_FED)
		user.set_nutrition(min((user.nutrition + target.nutrition), NUTRITION_LEVEL_WELL_FED))

	// Absorb a lizard, speak Draconic.
	owner.copy_languages(target, LANGUAGE_ABSORB)

	if(target.mind && user.mind)//if the victim and user have minds

		var/datum/mind/suckedbrain = target.mind
		user.mind.memory += "<BR><b>We've absorbed [target]'s memories into our own...</b><BR>[suckedbrain.memory]<BR>"
		for(var/A in suckedbrain.antag_datums)
			var/datum/antagonist/antag_types = A
			var/list/all_objectives = antag_types.objectives.Copy()
			if(antag_types.antag_memory)
				user.mind.memory += "[antag_types.antag_memory]<BR>"
			if(LAZYLEN(all_objectives))
				user.mind.memory += "<B>Objectives:</B>"
				var/obj_count = 1
				for(var/O in all_objectives)
					var/datum/objective/objective = O
					user.mind.memory += "<br><B>Objective #[obj_count++]</B>: [objective.explanation_text]"
					var/list/datum/mind/other_owners = objective.get_owners() - suckedbrain
					if(other_owners.len)
						user.mind.memory += "<ul>"
						for(var/mind in other_owners)
							var/datum/mind/M = mind
							user.mind.memory += "<li>Conspirator: [M.name]</li>"
						user.mind.memory += "</ul>"
		user.mind.memory += "<b>That's all [target] had.</b><BR>"
		user.memory() //I can read your mind, kekeke. Output all their notes.

		//Some of target's recent speech, so the changeling can attempt to imitate them better.
		//Recent as opposed to all because rounds tend to have a LOT of text.

		var/list/recent_speech = list()
		var/list/say_log = list()
		var/log_source = target.logging
		for(var/log_type in log_source)
			var/nlog_type = text2num(log_type)
			if(nlog_type & LOG_SAY)
				var/list/reversed = log_source[log_type]
				if(islist(reversed))
					say_log = reverse_range(reversed.Copy())
					break

		if(LAZYLEN(say_log) > LING_ABSORB_RECENT_SPEECH)
			recent_speech = say_log.Copy(say_log.len-LING_ABSORB_RECENT_SPEECH+1,0) //0 so len-LING_ARS+1 to end of list
		else
			for(var/spoken_memory in say_log)
				if(recent_speech.len >= LING_ABSORB_RECENT_SPEECH)
					break
				recent_speech[spoken_memory] = say_log[spoken_memory]

		if(recent_speech.len)
			changeling.antag_memory += "<B>Some of [target]'s speech patterns, we should study these to better impersonate [target.p_them()]!</B><br>"
			to_chat(user, span_boldnotice("Some of [target]'s speech patterns, we should study these to better impersonate [target.p_them()]!"))
			for(var/spoken_memory in recent_speech)
				changeling.antag_memory += "\"[recent_speech[spoken_memory]]\"<br>"
				to_chat(user, span_notice("\"[recent_speech[spoken_memory]]\""))
			changeling.antag_memory += "<B>We have no more knowledge of [target]'s speech patterns.</B><br>"
			to_chat(user, span_boldnotice("We have no more knowledge of [target]'s speech patterns."))


		var/datum/antagonist/changeling/target_ling = target.mind.has_antag_datum(/datum/antagonist/changeling)
		if(target_ling)//If the target was a changeling, suck out their extra juice and objective points!
			to_chat(user, span_boldnotice("[target] was one of us. We have absorbed their power."))
			target_ling.remove_changeling_powers()
			changeling.geneticpoints += round(target_ling.geneticpoints/2)
			target_ling.geneticpoints = 0
			target_ling.canrespec = 0
			changeling.chem_storage += round(target_ling.chem_storage/2)
			changeling.adjust_chemicals(round(target_ling.chem_storage/2))
			target_ling.chem_charges = 0
			target_ling.chem_storage = 0
			changeling.absorbedcount += (target_ling.absorbedcount)
			target_ling.stored_profiles.len = 1
			target_ling.absorbedcount = 0
			target_ling.was_absorbed = TRUE

	changeling.isabsorbing = 0
	changeling.adjust_chemicals(10)
	changeling.canrespec = 1

	target.death(0)
	target.Drain()
	return TRUE
