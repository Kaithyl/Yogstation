

/mob/living/carbon/alien/larva/Life(seconds, times_fired)
	set invisibility = 0
	if (notransform)
		return
	if(..() && LIFETICK_SKIP(src, times_fired)) //not dead and not in stasis
		// GROW!
		if(amount_grown < max_grown)
			amount_grown++
			update_icons()


/mob/living/carbon/alien/larva/update_stat()
	if(status_flags & GODMODE)
		return
	if(stat != DEAD)
		if(health<= -maxHealth || !getorgan(/obj/item/organ/brain))
			death()
			return
		if(IsUnconscious() || IsSleeping() || getOxyLoss() > 50 || (HAS_TRAIT(src, TRAIT_DEATHCOMA)) || health <= crit_threshold)
			if(stat == CONSCIOUS)
				set_stat(UNCONSCIOUS)
				blind_eyes(1)
				update_mobility()
		else
			if(stat == UNCONSCIOUS)
				set_stat(CONSCIOUS)
				set_resting(FALSE)
				adjust_blindness(-1)
	update_damage_hud()
	update_health_hud()
