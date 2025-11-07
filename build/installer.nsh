!macro customUnInstall
  ; Create a checkbox to ask user if they want to remove all data
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to remove all user data and settings?$\n$\nThis will delete:$\n- Recent projects list$\n- Search paths configuration$\n- Editor preferences$\n- All app settings$\n$\nLocation: $APPDATA\${PRODUCT_FILENAME}" IDYES removeData IDNO skipData
  
  removeData:
    ; Remove the app data folder
    RMDir /r "$APPDATA\${PRODUCT_FILENAME}"
    DetailPrint "Removed user data from $APPDATA\${PRODUCT_FILENAME}"
    Goto done
  
  skipData:
    DetailPrint "User data preserved in $APPDATA\${PRODUCT_FILENAME}"
  
  done:
!macroend
