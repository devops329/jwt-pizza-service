# Penetration Test report

Names: Aiden Martin & Peter Fullmer

## ----------------- Personal Attack - Peter -----------------

| Item           | Result                                                  |
| -------------- | ------------------------------------------------------- |
| Date           | June 11, 2025                                           |
| Target         | pizza-service.myjwtpizza.click                          |
| Classification | Broken Access Control                                   |
| Severity       | 1                                                       |
| Description    | Found config file by downloading GitHub action artifact |
| Images         | ![Pasted image](Pasted%20image%20250415140309.png)      |
| Corrections    | Make GitHub repo private                                |

| Item           | Result                                             |
| -------------- | -------------------------------------------------- |
| Date           | June 12, 2025                                      |
| Target         | pizza-service.amartin.click/api/docs               |
| Classification | Insecure Design                                    |
| Severity       | 4                                                  |
| Description    | Bombarded server to attempt to take it down        |
| Images         | ![Pasted image](Pasted%20image%20250412145248.png) |
| Corrections    | Detect DOS attacks and prevent them                |

## ----------------- Personal Attack - Aiden -----------------

| Item           | Result                                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | April 12, 2025                                                                                                                                                          |
| Target         | pizza.amartin.click                                                                                                                                                     |
| Classification | Security Misconfiguration                                                                                                                                               |
| Severity       | 3                                                                                                                                                                       |
| Description    | Hit pizza-service.amartin.click/api/docs to obtain various curl commands that were used to insert default credentials. Credentials still worked, allowing admin access. |
| Images         | ![Pasted image](Pasted%20image%20250415141937.png)                                                                                                                      |
| Corrections    | Remove the “example” curl text above the api endpoints in my service code.                                                                                              |

## ----------- Peer Attack - Peter attacking Aiden -----------

| Item           | Result                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Date           | June 11, 2025                                                                                                                                                      |
| Target         | pizza-service.amartin.click                                                                                                                                        |
| Classification | Broken Access Control                                                                                                                                              |
| Severity       | 1                                                                                                                                                                  |
| Description    | Found config file by downloading github action artifact                                                                                                            |
| Images         | ![Pasted image](Pasted%20image%20250412123734.png)<br>![Pasted image](Pasted%20image%20250412123812.png)<br>![Pasted image](Pasted%20image%20250412124821.png)<br> |
| Corrections    | Make GitHub repo private (disconnect from formed repository)                                                                                                       |

| Item           | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | June 12, 2025                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Target         | pizza-service.amartin.click                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Classification | Injection                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Severity       | 3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Description    | SQL injection performed on updateUser to get admin's auth token without their password                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Images         | ![Pasted image](Pasted%20image%20250412134438.png)<br>Although the request appears to have failed, the update still went through. We can see the results by logging in again:<br>![Pasted image](Pasted%20image%20250412134601.png)<br>Got the admin's ID! In this case, it is 1. Now we'll get an auth token for user 1:<br>![Pasted image](Pasted%20image%20250412135041.png)<br>Now we login again to get the token:<br>![Pasted image](Pasted%20image%20250412135136.png)<br>Got the admin's auth token! (assuming the admin was active recently. If not, name will be blank, as shown here.) |
| Corrections    | Use question marks to insert params into SQL queries                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

| Item           | Result                                             |
| -------------- | -------------------------------------------------- |
| Date           | June 12, 2025                                      |
| Target         | pizza-service.amartin.click                        |
| Classification | Server side request forgery                        |
| Severity       | 10                                                 |
| Description    | Ordered an expensive pizza under a fake user       |
| Images         | ![Pasted image](Pasted%20image%20250412142518.png) |
| Corrections    | Prevent exposure of factory API key                |

| Item           | Result                                             |
| -------------- | -------------------------------------------------- |
| Date           | June 12, 2025                                      |
| Target         | pizza-service.amartin.click/api/docs               |
| Classification | Insecure Design                                    |
| Severity       | 4                                                  |
| Description    | Bombarded server to attempt to take it down        |
| Images         | ![Pasted image](Pasted%20image%20250412145248.png) |

## ----------- Peer Attack - Aiden attacking Peter -----------

| Item           | Result                                                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | April 12, 2025                                                                                                                                                             |
| Target         | pizza.amartin.click                                                                                                                                                        |
| Classification | Security Misconfiguration                                                                                                                                                  |
| Severity       | 3                                                                                                                                                                          |
| Description    | Hit pizza-service.myjwtpizza.click/api/docs to obtain various curl commands that were used to insert default credentials. Credentials still worked, allowing admin access. |
| Images         | ![Pasted image](Pasted%20image%20250415141937.png)                                                                                                                         |
| Corrections    | Remove the “example” curl text above the api endpoints in my service code.                                                                                                 |

| Item           | Result                                                                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | April 12, 2025                                                                                                                                                                                     |
| Target         | pizza.myjwtpizza.click                                                                                                                                                                             |
| Classification | Security Misconfiguration                                                                                                                                                                          |
| Severity       | 2                                                                                                                                                                                                  |
| Description    | Using admin credentials, various franchises and expensive pizzas were added, all of which were attached to the attacker's own account. Users could only order pizza from the attacker's franchise. |
| Images         | ![Pasted image](Pasted%20image%20250415142531.png)<br>![Pasted image](Pasted%20image%20250415142614.png)                                                                                           |
| Corrections    | Remove api docs examples, recover admin credentials                                                                                                                                                |

| Item           | Result                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date           | April 12, 2025                                                                                                                                                                          |
| Target         | pizza.myjwtpizza.click                                                                                                                                                                  |
| Classification | Security Misconfiguration                                                                                                                                                               |
| Severity       | 2                                                                                                                                                                                       |
| Description    | Using a curl command and an admin auth token, the admin login was changed to be connected to the attacker’s email, and the password was changed to prevent changes from being reversed. |
| Images         | ![Pasted image](Pasted%20image%20250415142842.png)                                                                                                                                      |
| Corrections    | Remove api docs examples, recover admin credentials                                                                                                                                     |

## Conclusions

Good ideas for security:

- Don’t have your admin’s credentials as examples in your api doc endpoint.
- Credentials shouldn’t be anywhere that isn’t included in a .gitignore
- Make your repository private
- Use good practices to avoid DOS attacks
- Sanitize inputs and outputs from every endpoint to prevent SQL injections
