/**
 * Copyright (c) 2023 Kaithyl (https://github.com/kaithyl)
 * SPDX-License-Identifier: MIT
 */

/obj/machinery/inspector_booth
	name = "inspector booth"
	desc = "Used for inspecting paperwork."
	icon = 'icons/obj/machines/sleeper.dmi'
	icon_state = "sleeper"
	// TODO: add reduced power usage for part upgrades
	//use_power = IDLE_POWER_USE
	//idle_power_usage = 50
	circuit = /obj/item/circuitboard/machine/inspector_booth
	
	// TODO: add increased health and armor for part upgrades
	// armor = list(MELEE = 25, BULLET = 10, LASER = 10, ENERGY = 0, BOMB = 0, BIO = 0, RAD = 0, FIRE = 50, ACID = 70)
	// max_integrity = 200

	var/debug = FALSE
	var/item_ids = 0
	var/item_list = list()

	// TODO: add increased item capacity for part upgrades
	var/max_items = 5

	var/stamp_types = list(
		"stamp-ok" = "stamp_approve.png",
		"stamp-deny" = "stamp_deny.png",
		"stamp-clown" = "stamp_clown.png",
	)

	var/sfx = list(
		"speaker" = 'sound/machines/inspector_booth/speech-announce.wav',
		"tray_open" = 'sound/machines/inspector_booth/stampbar-open.wav',
		"tray_close" = 'sound/machines/inspector_booth/stampbar-close.wav',
		"stamp_up" = 'sound/machines/inspector_booth/stamp-up.wav',
		"stamp_down" = 'sound/machines/inspector_booth/stamp-down.wav',
		"drag_start" = 'sound/machines/inspector_booth/paper-dragstart1.wav',
		"drag_stop" = 'sound/machines/inspector_booth/paper-dragstop1.wav',
	)

/obj/machinery/inspector_booth/Initialize()
	. = ..()

/obj/machinery/inspector_booth/attackby(obj/item/I, mob/user, params)
	if (contents.len >= max_items)
		to_chat(user, span_warning("\The [src] is full!"))
		return
	var/valid = FALSE
	if (istype(I, /obj/item/paper) || istype(I, /obj/item/card/id))
		valid = TRUE
	if(valid)
		// TODO: Add auto extinguishing/decontam for part upgrades
		if (I.resistance_flags & ON_FIRE)
			to_chat(user, span_warning("\The [src] rejects the burning [I]."))
		else
			if(user.transferItemToLoc(I, src))
				user.visible_message("[user] inserts \the [I] into \the [src].", \
				span_notice("You insert \the [I] into \the [src]."))
				item_list["item"+ num2text(++item_ids)] = list("item" = I, "x" = 0, "y" = 0, "z" = 0)
			else
				to_chat(user, span_warning("\The [I] is stuck to your hand, you cannot put it in \the [src]!"))
	else 
		to_chat(user, span_warning("\The [src] rejects \the [I]."))


/obj/machinery/inspector_booth/ui_interact(mob/user, datum/tgui/ui)
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "InspectorBooth", name)
		ui.open()

/obj/machinery/inspector_booth/ui_data(mob/living/carbon/human/user)
	var/list/data = list()
		
	data["debug"] = debug

	var/list/items = list()
	for (var/key in item_list)
		var/I = item_list[key]["item"]
		if (istype(I, /obj/item/paper))
			var/obj/item/paper/P = I
			var/text = P.info
			for (var/i = 1; i <= P.written.len; ++i)
				if(istype(P.written[i] ,/datum/langtext))
					var/datum/langtext/L = P.written[i]
					text += "\n" + L.text
			// Byond combines lists when adding by default but we want a list of lists
			items["papers"] += list(list("id" = key, "text" = text, "stamps" = P.stamps, "x" = item_list[key]["x"], "y" = item_list[key]["y"], "z" = item_list[key]["z"]))
		if (istype(I, /obj/item/card/id))
			var/obj/item/card/id/D = I
			items["idcards"] += list(list("id" = key, "name" = D.registered_name, "age" = D.registered_age, "job" = D.assignment, "original_job" = D.originalassignment))
	
	data["items"] = items

	var/list/stamps = list()
	for (var/obj/item/stamp/S in component_parts)
		var/name = S.icon_state
		if (name in stamp_types)
			stamps += list(list("type" = name, "icon" = stamp_types[name]))
		else
			stamps += list(list("type" = name, "icon" = "stamp_unknown.png"))
	data["stamps"] = stamps
			
	return data

/obj/machinery/inspector_booth/ui_act(action, list/params)
	if(..())
		return
	
	var/mob/living/user = params["ckey"] ? get_mob_by_key(params["ckey"]) : null
	var/obj/item = (params["id"] && params["id"] in item_list) ? item_list[params["id"]]["item"] : null

	switch(action)
		if("play_sfx")
			var/name = params["name"]
			if (name in sfx)
				var/volume = params["volume"] ? params["volume"] : 50
				var/vary = params["vary"] ? params["vary"] : 1
				var/extra_range = params["extrarange"] ? params["extrarange"] : -3
				playsound(user ? user : src, sfx[name], volume, vary, extra_range)
				. = TRUE
		if("stamp_item")
			var/type = params["type"] ? params["type"] : "stamp-mime"
			if (item != null)
				if (istype(item, /obj/item/paper))
					var/obj/item/paper/P = item
					// This could be moved into a proc in Paper.dm
					var/datum/asset/spritesheet/sheet = get_asset_datum(/datum/asset/spritesheet/simple/paper)
					if (isnull(P.stamps))
						P.stamps = sheet.css_tag()
					P.stamps += sheet.icon_tag(type)
					. = TRUE
		if("move_item")
			if (params["id"] in item_list)
				var/id = params["id"]
				item_list[id]["x"] = params["x"]
				item_list[id]["y"] = params["y"]
				item_list[id]["z"] = params["z"]
				. = TRUE
		if("take_item")
			if (user && item && !QDELETED(item))
				user.put_in_hands(item)
				item_list -= params["id"]
				. = TRUE
		if("drop_item")
			if (item && !QDELETED(item))
				item.forceMove(drop_location())
				item_list -= params["id"]
				. = TRUE

/obj/machinery/inspector_booth/ui_assets(mob/user)
	return list(
		get_asset_datum(/datum/asset/simple/inspector_booth),
		get_asset_datum(/datum/asset/spritesheet/simple/paper),
	)
