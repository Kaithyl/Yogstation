/obj/machinery/inspector_booth
	name = "inspector booth"
	desc = "Used to inspect paperwork."
	icon = 'icons/obj/machines/sleeper.dmi'
	icon_state = "sleeper"
	//use_power = IDLE_POWER_USE
	//idle_power_usage = 50
	circuit = /obj/item/circuitboard/machine/inspector_booth

	var/max_items = 10

	var/sfx_speaker = 'sound/machines/inspector_booth/speech-announce.wav'
	var/sfx_tray_open = 'sound/machines/inspector_booth/stampbar-open.wav'
	var/sfx_tray_close = 'sound/machines/inspector_booth/stampbar-close.wav'
	var/sfx_stamp_up = 'sound/machines/inspector_booth/stamp-up.wav'
	var/sfx_stamp_down = 'sound/machines/inspector_booth/stamp-down.wav'

/obj/machinery/inspector_booth/Initialize()
	. = ..()

/obj/machinery/inspector_booth/attackby(obj/item/I, mob/user, params)
	if (contents.len >= max_items)
		to_chat(user, span_warning("\The [src] is full!"))
		return
	var/valid = FALSE
	if (istype(I, /obj/item/paper))
		valid = TRUE
	if(valid)
		// TODO: Add auto extinguishing/decontam for part upgrades
		if (I.resistance_flags & ON_FIRE)
			to_chat(user, span_warning("\The [src] rejects \the [I]."))
		else
			if(user.transferItemToLoc(I, src))
				user.visible_message("[user] inserts \the [I] into \the [src].", \
				span_notice("You insert \the [I] into \the [src]."))
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
	data["items"] = list()
	for (var/obj/item/paper/P in src)
		data["items"] += P.info
			
	return data

/obj/machinery/inspector_booth/ui_act(action, list/params)
	if(..())
		return
	switch(action)
		if("speaker")
			playsound(src, sfx_speaker, 50, 1, 7)
			. = TRUE
		if("tray_open")
			playsound(src, sfx_tray_open, 50, 1, -3)
			. = TRUE
		if("tray_close")
			playsound(src, sfx_tray_close, 50, 1, -3)
			. = TRUE
		if("stamp_up")
			playsound(src, sfx_stamp_up, 50, 1, -3)
			. = TRUE
		if("stamp_down")
			playsound(src, sfx_stamp_down, 50, 1, -3)
			. = TRUE

/obj/machinery/inspector_booth/ui_assets(mob/user)
	return list(
		get_asset_datum(/datum/asset/simple/inspector_booth),
	)
