# Semantic models

`SampleSales` is a tiny TMDL fixture used to prove `ConnectFolder` on Linux.

To work on `ITSM_Service_Intelligence.pbix` from a Cloud Agent:

1. In Power BI Desktop, **File → Save as → Power BI project (.pbip)**.
2. Copy `ITSM_Service_Intelligence.SemanticModel/` into this folder.
3. Ask the agent to open
   `models/ITSM_Service_Intelligence.SemanticModel/definition`
   with `connection_operations` / `ConnectFolder` in `--readonly` mode.

A `.pbix` cannot be attached here. Desktop hosts it as a local Analysis
Services instance on Windows only.
