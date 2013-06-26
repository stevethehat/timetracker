import json, sys
from datetime import datetime
from time import strftime, time


def print_events(events, task_names):
	print "-----------------------------"
	print "Events"
	print "-----------------------------"

	for event in events:
		print ""
		print event
		print ""

	for event in events:
		try:
			print ""
			starttime_unix = event["starttime"]
			endtime_unix = event["endtime"]
			start = datetime.fromtimestamp(starttime_unix)

			if not(endtime_unix):
				print "Current"
				endtime_unix = time()
			end = datetime.fromtimestamp(endtime_unix)

			print "%s > %s" % (start.strftime("%Y-%m-%d %H:%M"), end.strftime("%Y-%m-%d %H:%M"))
			print task_names[event["taskid"]]
			#print "%s > %s" % (starttime_unix, endtime_unix)
			#print "%s > %s" % (start, end)
			#print "%s > %s" % (start.strftime("%c"), end.strftime("%c"))
		except Exception as e:
			print "error (%s)" % e

def print_tasks(tasks):
	print "-----------------------------"
	print "Tasks"
	print "-----------------------------"

	for task in tasks:
		print ""
		print task
		print ""

def get_task_names(tasks):
	task_names = {}

	for task in tasks:
		task_names[task["id"]] = task["title"]

	return(task_names)

json_backup_file = open("/Users/steve.lamb/Dropbox/timetracker-backup.json", "r")
json_backup = json_backup_file.read()
json_backup_file.close()

json_backup = json.loads(json_backup)

#print json_backup

tasks = json_backup["0"]["results"]
events = json_backup["1"]["results"]
task_names = get_task_names(tasks)


print_events(events, task_names)


