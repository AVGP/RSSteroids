Meteor._def_template("_loginButtons",Handlebars.json_ast_to_func(["<div id=\"login-buttons\" class=\"login-buttons-dropdown-align-",["{",[[0,"align"]]],"\">\n    ",["#",[[0,"if"],[0,"currentUser"]],["\n      ",["#",[[0,"if"],[0,"loggingIn"]],["\n        ","\n        ",["#",[[0,"if"],[0,"dropdown"]],["\n          ",[">","_loginButtonsLoggingIn"],"\n        "],["\n          <div class=\"login-buttons-with-only-one-button\">\n            ",[">","_loginButtonsLoggingInSingleLoginButton"],"\n          </div>\n        "]],"\n      "],["\n        ",[">","_loginButtonsLoggedIn"],"\n      "]],"\n    "],["\n      ",[">","_loginButtonsLoggedOut"],"\n    "]],"\n  </div>"]));
Meteor._def_template("_loginButtonsLoggedIn",Handlebars.json_ast_to_func([["#",[[0,"if"],[0,"dropdown"]],["\n    ",[">","_loginButtonsLoggedInDropdown"],"\n  "],["\n    <div class=\"login-buttons-with-only-one-button\">\n      ",[">","_loginButtonsLoggedInSingleLogoutButton"],"\n    </div>\n  "]]]));
Meteor._def_template("_loginButtonsLoggedOut",Handlebars.json_ast_to_func([["#",[[0,"if"],[0,"services"]],[" ","\n    ",["#",[[0,"if"],[0,"configurationLoaded"]],["\n      ",["#",[[0,"if"],[0,"dropdown"]],[" ","\n        ",[">","_loginButtonsLoggedOutDropdown"],"\n      "],["\n        ",["#",[[0,"with"],[0,"singleService"]],[" ","\n          <div class=\"login-buttons-with-only-one-button\">\n            ",["#",[[0,"if"],[0,"loggingIn"]],["\n              ",[">","_loginButtonsLoggingInSingleLoginButton"],"\n            "],["\n              ",[">","_loginButtonsLoggedOutSingleLoginButton"],"\n            "]],"\n          </div>\n        "]],"\n      "]],"\n    "]],"\n  "],["\n    <div class=\"no-services\">No login services configured</div>\n  "]]]));
Meteor._def_template("_loginButtonsMessages",Handlebars.json_ast_to_func([["#",[[0,"if"],[0,"errorMessage"]],["\n    <div class=\"message error-message\">",["{",[[0,"errorMessage"]]],"</div>\n  "]],"\n  ",["#",[[0,"if"],[0,"infoMessage"]],["\n    <div class=\"message info-message\">",["{",[[0,"infoMessage"]]],"</div>\n  "]]]));
Meteor._def_template("_loginButtonsLoggingIn",Handlebars.json_ast_to_func([[">","_loginButtonsLoggingInPadding"],"\n  <div class=\"loading\">&nbsp;</div>\n  ",[">","_loginButtonsLoggingInPadding"]]));
Meteor._def_template("_loginButtonsLoggingInPadding",Handlebars.json_ast_to_func([["#",[[0,"unless"],[0,"dropdown"]],["\n    ","\n    <div class=\"login-buttons-padding\">\n      <div class=\"login-button single-login-button\" style=\"visibility: hidden;\" id=\"login-buttons-logout\">&nbsp;</div>\n    </div>\n  "],["\n    ","\n    <div class=\"login-buttons-padding\" />\n  "]]]));
