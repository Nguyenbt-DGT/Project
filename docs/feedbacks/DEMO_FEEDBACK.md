# Demo Feedback Log

> One running log of feedback from each demo session, in the order it was received. Each section
> is a separate demo round; item numbering within a round matches the original feedback (so
> existing references like "DEMO_FEEDBACK_003 #2" in code comments and docs still point to the
> right item). New rounds are appended at the bottom — do not renumber past rounds.

---

## Demo 1 (DEMO_FEEDBACK_001)

I've tested the app for the 1st demo, here are the udpates:

1. The UI of the application kinda wrong. please view the image in ./images/health.png for more details of the page. The theme need to have the 'Orange feel' like that.
2. The rules defined in the GLOBAL_REQ.md and HEALTH_REQ.md are not implemented, for example I'm not input any bike information when first login. Please adjust.
3. The other of session listed in this page need to be:
   1. Live Vitals.
   2. Service Reminders.
   3. Spent this year.
4. There are no notification about the permission give for this application when I access to it.
5. When I mark as repalced for a part, there are no success message. Please adjust to have:
   1. When click, Yes/No pop up displayed to make sure User is agree to the Marking process.
   2. If Yes => Toast message displayed with the Part name in the content.
   3. If No => Close pop up.
   4. There is a button to undo the mark as replaced option. In real life, there are some point which user did something wrong and want to undo it. When this option is selected => Previous number need to be re-displayed for the part.
6. The Spent this year session also cannot be tapped to view details. Please adjust.

---

## Demo 2 (DEMO_FEEDBACK_002)

I've tested the app for the 2nd demo, here are the udpates:

1. I need the Language function. I want to switch between English and Vietnamese.
2. I want the edit odometer function to have 1 more option: Last service time.
   1. This is the checkpoint to calculate the next service time.
   2. For example:
      1. Odo = 35k km
      2. Last service time = 29k km
      3. Next service time is from 29k km

---

## Demo 3 (DEMO_FEEDBACK_003)

I've tested the app for the 3rd demo, here are the udpates:

1. Part item listed in the Service Reminder is not translated. These items also need to be translated.
2. When click on the item, the pop up is displayed. But when attempt to tap on a field to input the number, the keyboard (phone's keyboard) currently block the UI.

Please find the /workspaces/Project/design/images/Item_Bug_1.png to have more details bug.

Fix it.
3. For every app open time, EXPO need to re-download the app again. Users don't want the download process to be started over and over.
4. There still not have the place to input user's bike when access to the application. Please add this point.
5. There are 3 tabs in the application:
   1. Health (currently implemented)
   2. Touring (Please displays "Feature comming soon" when user access to this tab).
   3. Tracking: This is not a feature of this app. Please replace it to become: Lucky draw. And also give the "Feature comming soon" when user access.

---

## Demo 4 (DEMO_FEEDBACK_004)

I've tested the app for the 4th demo, here are the udpates:

1. The amount of money in the Spent this year session is hard as USD. Please change: If the language changed => The currency have to be changed accordingly.
2. The items in the Spent this year session are not translated to VI when I switch. Please adjust.
3. User is able to edit the service interval, last service, price paid in the Part details pop up.
4. Help me implement 1 more tab (HOME tab), located on the left-side of Health tab. This page have the requiremnt in ./HOME_REQ.md file.

---

## Demo 5 (DEMO_FEEDBACK_005)

I've tested the app for the 5th demo, here are the udpates:

1. The image on Home page is not shown after user import the image from the phone. Please fix. The image's size can be maximum 10mb.
2. We need to implement the Login - Logout - Register functions.
3. We will handle the user's data in the database.
4. The User's profile will be displayed in this place: /workspaces/Project/design/images/User-profile-location.png, and it will be displayed through all the tabs in the app. Which mean user can view their profile whenever they want.
5. There is a missmatch between the Health tab and Home tab: Bike's name has been changed to Z800 but the Home still displays CB500X. Please fix.
6. We need to display the Warning on Home page, the Warning is displayed like /workspaces/Project/design/images/Home-4th-sesson.png. All the overdue Parts need to be listed in this home page for this sesson. But if more than 3 options, please implement the scroll function.
7. On Home page, we need to add the Touring session and Lucky draw session to navigate to them. Here is the design: /workspaces/Project/design/images/Home-5th-sesson.png.

---

## Demo 6 (DEMO_FEEDBACK_006)

I've tested the app for the 6th demo, here are the udpates:

1. The design of the Night Garage is overlapping with the phone's time and others things on the top. Please move the UI down a little bit to avoid it. /workspaces/Project/design/images/Item_Bug_2.1.png
2. The km and mile option is too big while the field to input the number is too small. Please change into: Field big, km/miles options small./workspaces/Project/design/images/Item_Bug_2.2.png
3. When user input all information into the Set up your bike session => The Home and Health page are displayed without data, element and everything. Please fix.
4. I want to share this application for a friend. How to share it? Expo via email? How to do?
