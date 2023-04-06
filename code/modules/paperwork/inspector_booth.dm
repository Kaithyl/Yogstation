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

	var/icon_tray = "tray.png"

/obj/machinery/inspector_booth/Initialize()
	. = ..()

/obj/machinery/inspector_booth/ui_interact(mob/user, datum/tgui/ui)
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "InspectorBooth", name)
		ui.open()

/obj/machinery/inspector_booth/ui_data(mob/living/carbon/human/user)
	var/list/data = list()
	data["tray"] = icon_tray
	return data

/obj/machinery/inspector_booth/ui_act(action, list/params)
	if(..())
		return
	switch(action)
		if("speaker")
			playsound(src, sfx_speaker, 50)
			. = TRUE
		if("tray_open")
			playsound(src, sfx_tray_open, 50, 1, -5)
			. = TRUE
		if("tray_close")
			playsound(src, sfx_tray_close, 50, 1, -5)
			. = TRUE

/obj/machinery/inspector_booth/ui_assets(mob/user)
	return list(
		get_asset_datum(/datum/asset/simple/inspector_booth),
	)
