/obj/machinery/inspector_booth
	name = "inspector booth"
	desc = "Used to inspect paperwork."
	icon = 'icons/obj/machines/sleeper.dmi'
	icon_state = "sleeper"
	//use_power = IDLE_POWER_USE
	//idle_power_usage = 50
	circuit = /obj/item/circuitboard/machine/inspector_booth

/obj/machinery/inspector_booth/Initialize()
	. = ..()

/obj/machinery/computer/inspector_booth/ui_interact(mob/user, datum/tgui/ui)
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "InspectorBooth", name)
		ui.open()

/obj/machinery/inspector_booth/ui_data(mob/living/carbon/human/user)
	var/list/data = list()
	return data

/obj/machinery/computer/secure_data/ui_act(action, list/params)
	if(..())
		return
