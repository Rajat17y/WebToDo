# yourapp/management/commands/print_tasks.py
from django.core.management.base import BaseCommand
from mainapp.models import Tasks

class Command(BaseCommand):
    help = 'Print all tasks in the database'

    def handle(self, *args, **options):
        tasks = Tasks.objects.all()
        
        if not tasks:
            self.stdout.write("No tasks found in database")
            return
        
        self.stdout.write("ID | User | Task")
        self.stdout.write("-" * 80)
        
        for task in tasks:
            self.stdout.write(
                f"{task.id:3} | {task.user:15} | {task.task[:30]:30} | "
                #f"{task.created_at.strftime('%Y-%m-%d %H:%M')}"
            )