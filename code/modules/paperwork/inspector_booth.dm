/obj/machinery/inspector_booth
	name = "inspector booth"
	desc = "Used to inspect paperwork."
	icon = 'icons/obj/machines/sleeper.dmi'
	icon_state = "sleeper"
	//use_power = IDLE_POWER_USE
	//idle_power_usage = 50
	circuit = /obj/item/circuitboard/machine/inspector_booth

	var/sfx_speaker = 'sound/machines/inspector_booth/speech-announce.wav'
	var/sfx_tray_open = 'sound/machines/inspector_booth/stampbar-open.wav'
	var/sfx_tray_close = 'sound/machines/inspector_booth/stampbar-close.wav'
	var/sfx_stamp_up = 'sound/machines/inspector_booth/stamp-up.wav'
	var/sfx_stamp_down = 'sound/machines/inspector_booth/stamp-down.wav'

	var/icon_bg_desk = "desk.png"
	var/icon_tray_end = "tray_end.png"
	var/icon_tray_seg = "tray_segment.png"
	var/icon_tray_cover = "tray_cover.png"
	var/icon_stamp_approve = "stamp_approve.png"
	var/icon_stamp_deny = "stamp_deny.png"

/obj/machinery/inspector_booth/Initialize()
	. = ..()

/obj/machinery/inspector_booth/ui_interact(mob/user, datum/tgui/ui)
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "InspectorBooth", name)
		ui.open()

/obj/machinery/inspector_booth/ui_data(mob/living/carbon/human/user)
	var/list/data = list()
	data["bg_desk"] = icon_bg_desk
	data["tray_end"] = icon_tray_end
	data["tray_seg"] = icon_tray_seg
	data["tray_cover"] = icon_tray_cover
	data["stamp_approve"] = icon_stamp_approve
	data["stamp_deny"] = icon_stamp_deny
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
