import { describe, expect, it } from "vitest";
import { parseSessionEmail } from "../../../../src/web/client/utils/parseSessionEmail.js";
import { parseTeamsportEmail } from "../../../../src/web/client/utils/parseTeamsportEmail.js";

const teamsportEmail = `
Here are your race results.

Results for 3 - Family Race Session at 08:00

Heat overview\tBest score

1.\tJonny\t44.639
2.\tCondog\t47.374
3.\tDan Way\t48.995
4.\tGavin Hawkins\t51.720
5.\tMax R***\t56.236
6.\tMason H\t59.713
7.\tBen Reeves\t1:03.065
8.\tCharlie Way\t1:07.602
9.\tElla Hawkins\t1:19.641
Detailed results
 
Jonny\tCondog\tDan Way\tGavin Hawkins\tMax R***\tMason H\tBen Reeves\tCharlie Way\tElla Hawkins
1\t1:10.171\t1:35.425\t1:38.908\t1:11.507\t1:45.971\t1:22.869\t1:57.390\t1:54.145\t1:51.933
2\t49.872\t55.719\t53.061\t52.189\t56.766\t1:18.661\t1:06.524\t1:48.460\t1:30.845
3\t51.121\t50.528\t58.504\t53.960\t56.575\t1:10.594\t1:06.987\t1:57.118\t1:42.397
4\t52.074\t56.559\t1:19.043\t51.720\t59.063\t1:14.071\t1:22.798\t1:16.597\t1:20.912
5\t1:04.075\t1:05.169\t54.473\t1:06.760\t1:04.708\t1:14.946\t1:15.079\t1:32.256\t1:25.483
6\t53.371\t53.803\t50.208\t55.536\t59.947\t1:03.697\t1:07.628\t1:11.334\t1:27.347
7\t47.064\t47.374\t54.593\t56.595\t59.679\t1:02.314\t1:03.065\t1:09.325\t1:19.641
8\t50.359\t50.271\t56.534\t51.947\t56.605\t1:00.989\t1:06.033\t1:12.676\t1:28.232
9\t49.027\t48.638\t52.904\t52.533\t56.236\t59.713\t1:04.031\t1:07.602\t
10\t51.605\t1:40.156\t1:03.198\t51.754\t56.299\t1:01.900\t1:07.739\t\t
11\t44.639\t51.033\t55.811\t54.690\t58.301\t1:04.275\t1:07.123\t\t
12\t48.350\t51.654\t48.995\t54.267\t56.552\t1:04.185\t\t\t
13\t49.331\t55.577\t52.532\t57.519\t56.422\t\t\t\t
14\t47.131\t\t\t\t\t\t\t\t
Avg.\t52.013\t1:00.146\t59.904\t56.229\t1:01.778\t1:08.184\t1:13.127\t1:27.723\t1:30.848
Hist.\t43.156\t45.469\t\t\t48.657\t\t1:00.640\t\t
43.295\t45.518\t\t\t49.198\t\t1:03.667\t\t
43.340\t46.158\t\t\t49.317\t\t1:05.297\t\t
`;

describe("parseTeamsportEmail", () => {
  it("parses driver laps without pulling historical rows", () => {
    const parsed = parseTeamsportEmail(teamsportEmail);
    expect(parsed?.provider).toBe("teamsport");
    expect(parsed?.drivers.length).toBeGreaterThan(0);
    const jonny = parsed?.drivers.find((d) => d.name === "Jonny");
    expect(jonny?.classification).toBe(1);
    expect(jonny?.laps.length).toBe(14);
    expect(jonny?.laps[0].timeSeconds).toBeCloseTo(70.171, 3);
    expect(jonny?.laps[1].timeSeconds).toBeCloseTo(49.872, 3);
    expect(jonny?.laps[13].timeSeconds).toBeCloseTo(47.131, 3);
  });

  it("prefers teamsport in the entrypoint", () => {
    const parsed = parseSessionEmail(teamsportEmail);
    expect(parsed?.provider).toBe("teamsport");
  });
});
